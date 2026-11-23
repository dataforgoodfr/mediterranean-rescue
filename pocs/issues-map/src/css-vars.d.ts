// Variables CSS posées en style inline : rang d'apparition des planches et des repères.
import "react";

declare module "react" {
  interface CSSProperties {
    "--i"?: number;
    "--b"?: number;
  }
}
