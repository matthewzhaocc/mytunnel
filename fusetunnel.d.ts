import { EventEmitter } from 'events';

declare interface Tunnel extends EventEmitter {
  url: string;
  clientId: string;
}

declare interface BootstrapOpts {
  port: number;
  host: string;
  subdomain?: string;
  local_host?: string;
  local_https?: boolean;
  local_cert?: string;
  local_key?: string;
  local_ca?: string;
  allow_invalid_cert?: boolean;
  insecure?: boolean;
}

declare const localtunnel: (opts: BootstrapOpts) => Promise<Tunnel>;

export default localtunnel;
