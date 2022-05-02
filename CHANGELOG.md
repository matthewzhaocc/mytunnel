# 3.2.6 (2022-05-01)

- Fusetunnel now supports the use of secrets to protect private fusetunnel deployments.

# 3.2.5 (2021-05-25)

- Fusetunnel now handles close properly.

# 3.2.4 (2021-05-24)

- Add the clientId to the Tunnel type definition.

# 3.2.3 (2021-05-20)

- Switch prettier to dev dependency.

# 3.2.2 (2021-05-20)

- Switch to a manual calculation for sha256 fingerprint to ensure backward compatibility.

# 3.2.1 (2021-02-22)

- Removed pings to server as they violate correct use of the tcp socket passed to httpAgent

# 3.2.0 (2021-02-20)

- Added TS typings
- Rebranded to "mytunnel"
- Added pings to server to help with dead connections detection.

# 2.0.1 (2021-01-09)

- Upgrade dependencies

# 2.0.0 (2019-09-16)

- Add support for tunneling a local HTTPS server
- Add support for localtunnel server with IP-based tunnel URLs
- Node.js client API is now Promise-based, with backwards compatibility to callback
- Major refactor of entire codebase using modern ES syntax (requires Node.js v8.3.0 or above)

# 1.9.2 (2019-06-01)

- Update debug to 4.1.1
- Update axios to 0.19.0

# 1.9.1 (2018-09-08)

- Update debug to 2.6.9

# 1.9.0 (2018-04-03)

- Add _request_ event to Tunnel emitter
- Update yargs to support config via environment variables
- Add basic request logging when --print-requests argument is used

# 1.8.3 (2017-06-11)

- update request dependency
- update debug dependency
- update openurl dependency

# 1.8.2 (2016-11-17)

- fix host header transform
- update request dependency

# 1.8.1 (2016-01-20)

- fix bug w/ HostHeaderTransformer and binary data

# 1.8.0 (2015-11-04)

- pass socket errors up to top level

# 1.7.0 (2015-07-22)

- add short arg options

# 1.6.0 (2015-05-15)

- keep sockets alive after connecting
- add --open param to CLI

# 1.5.0 (2014-10-25)

- capture all errors on remote socket and restart the tunnel

# 1.4.0 (2014-08-31)

- don't emit errors for ETIMEDOUT

# 1.2.0 / 2014-04-28

- return `client` from `localtunnel` API instantiation

# 1.1.0 / 2014-02-24

- add a host header transform to change the 'Host' header in requests

# 1.0.0 / 2014-02-14

- default to localltunnel.me for host
- remove exported `connect` method (just export one function that does the same thing)
- change localtunnel signature to (port, opt, fn)

# 0.2.2 / 2014-01-09
