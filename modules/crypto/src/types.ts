export type CryptoHashOptions = {
  modules?: {[moduleName: string]: any};
  crypto?: {
    algorithm;
    onEnd?;
  };
};
