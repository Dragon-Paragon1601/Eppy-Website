import { useEffect } from "react";

export default function Callback() {
  useEffect(() => {
    window.opener.postMessage("authComplete", window.location.origin);
    window.close();
  }, []);

  return null;
}