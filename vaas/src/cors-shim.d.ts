declare module "cors" {
  import { RequestHandler } from "express";
  interface CorsOptions {
    origin?: string | boolean | RegExp | (string | RegExp)[];
    methods?: string | string[];
    allowedHeaders?: string | string[];
    [key: string]: any;
  }

  function cors(options?: CorsOptions): RequestHandler;
  export = cors;
}
