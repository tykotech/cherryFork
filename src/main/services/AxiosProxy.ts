import { AxiosInstance, default as axios_ } from 'axios'
import { ProxyAgent } from 'proxy-agent'

import { proxyManager } from './ProxyManager'

class AxiosProxy {
  private cacheAxios: AxiosInstance | null = null
  private proxyAgent: ProxyAgent | null = null

  get axios(): AxiosInstance {
    const currentProxyAgent = proxyManager.getProxyAgent()

    // If the proxy changes or is not initialized, recreate the axios instance
    if (this.cacheAxios === null || (currentProxyAgent !== null && this.proxyAgent !== currentProxyAgent)) {
      this.proxyAgent = currentProxyAgent

      // Create an axios instance with proxy configuration
      this.cacheAxios = axios_.create({
        proxy: false,
        httpAgent: currentProxyAgent || undefined,
        httpsAgent: currentProxyAgent || undefined
      })
    }

    return this.cacheAxios
  }
}

export default new AxiosProxy()
