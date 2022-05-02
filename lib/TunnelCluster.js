const { EventEmitter } = require('events');
const debug = require('debug')('mytunnel:client');
const fs = require('fs');
const net = require('net');
const tls = require('tls');
const constants = require('constants');
const HeaderHostTransformer = require('./HeaderHostTransformer');
const crypto = require('crypto');
tls.DEFAULT_ECDH_CURVE = 'auto';
// manages groups of tunnels
module.exports = class TunnelCluster extends EventEmitter {
  constructor(opts = {}) {
    super(opts);
    this.opts = opts;
  }

  open() {
    const opt = this.opts;

    // Prefer IP if returned by the server
    const remoteHostOrIp = opt.OverrideTunnelIp || opt.remote_ip || opt.remote_host;
    const remotePort = opt.remote_port;
    const localHost = opt.local_host || 'localhost';
    const localPort = opt.local_port;
    const localProtocol = opt.local_https ? 'https' : 'http';
    const allowInvalidCert = opt.allow_invalid_cert;
    const isTls = opt.isTls;
    const cert = opt.certificate;
    debug('establishing tunnel %s://%s:%s <> %s:%s', localProtocol, localHost, localPort, remoteHostOrIp, remotePort);
    let remote;
    if (isTls) {
      remote = tls.connect({
        host: remoteHostOrIp,
        port: remotePort,
        rejectUnauthorized: false,
        minVersion: 'TLSv1.3',
      });
    } else {
      remote = net.connect({
        host: remoteHostOrIp,
        port: remotePort,
      });
    }

    remote.setKeepAlive(true);
    remote.on('error', (err) => {
      debug('got remote connection error', err.message);
      // emit connection refused errors immediately, because they
      // indicate that the tunnel can't be established.
      if (err.code === 'ECONNREFUSED') {
        this.emit(
          'error',
          new Error(`connection refused: ${remoteHostOrIp}:${remotePort} (check your firewall settings)`)
        );
      }

      remote.end();
    });

    const connLocal = () => {
      if (remote.destroyed) {
        debug('remote destroyed');
        this.emit('dead');
        return;
      }

      debug('connecting locally to %s://%s:%d', localProtocol, localHost, localPort);
      remote.pause();

      if (allowInvalidCert) {
        debug('allowing invalid certificates');
      }

      const getLocalCertOpts = () =>
        allowInvalidCert
          ? { rejectUnauthorized: false }
          : {
              cert: fs.readFileSync(opt.local_cert),
              key: fs.readFileSync(opt.local_key),
              ca: opt.local_ca ? [fs.readFileSync(opt.local_ca)] : undefined,
            };

      // connection to local http server
      const local = opt.local_https
        ? tls.connect({
            host: localHost,
            port: localPort,
            ...getLocalCertOpts(),
          })
        : net.connect({ host: localHost, port: localPort });

      const remoteClose = () => {
        debug('remote close');
        this.emit('dead');
        local.end();
      };

      remote.once('close', remoteClose);

      // TODO some languages have single threaded servers which makes opening up
      // multiple local connections impossible. We need a smarter way to scale
      // and adjust for such instances to avoid beating on the door of the server
      local.once('error', (err) => {
        debug('local error %s', err.message);
        local.end();

        remote.removeListener('close', remoteClose);

        if (err.code !== 'ECONNREFUSED') {
          return remote.end();
        }

        // retrying connection to local server
        setTimeout(connLocal, 1000);
      });

      local.once('connect', () => {
        debug('connected locally');
        remote.resume();

        let stream = remote;

        // if user requested specific local host
        // then we use host header transform to replace the host header
        if (opt.local_host) {
          debug('transform Host header to %s', opt.local_host);
          stream = remote.pipe(new HeaderHostTransformer({ host: opt.local_host }));
        }

        stream.pipe(local).pipe(remote);

        // when local closes, also get a new remote
        local.once('close', (hadError) => {
          debug('local connection closed [%s]', hadError);
        });
      });
    };

    remote.on('data', (data) => {
      const match = data.toString().match(/^(\w+) (\S+)/);
      if (match) {
        this.emit('request', {
          method: match[1],
          path: match[2],
        });
      }
    });

    // tunnel is considered open when remote connects
    remote.once(isTls ? 'secureConnect' : 'connect', () => {
      if (isTls) {
        debug('TLS is enabled');
        const baseString = cert.match(/-----BEGIN CERTIFICATE-----\s*([\s\S]+?)\s*-----END CERTIFICATE-----/i);
        const rawCert = Buffer.from(baseString[1], 'base64');
        const sha256sum = crypto.createHash('sha256').update(rawCert).digest('hex');
        const fingerprint = sha256sum.toUpperCase().replace(/(.{2})(?!$)/g, '$1:');
        // eg 83:6E:3E:99:58:44:AE:61:72:55:AD:C6:24:BE:5C:2D:46:21:BA:BE:87:E4:3A:38:C8:E8:09:AC:22:48:46:20
        try {
          if (fingerprint !== remote.getPeerCertificate().fingerprint256) {
            this.emit('error', {
              message: 'tls certificate does not match what was sent over',
            });
            return;
          }
        } catch {
          this.emit('error', {
            message: 'tls socket closed too fast, was not able to verify the fingerprint',
          });
          return;
        }
      }
      this.emit('open', remote);
      connLocal();
    });
  }
};
