import "axios";
declare module "axios" {
  export interface AxiosRequestConfig { metadata?: Record<string, any> }
}
