import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Icon, ToolBar, LazyComponent } from "../../../utils/general";
import { encodeUrl, initScramjet } from "../../../lib/scramjet";

export const EdgeMenu = () => {
  const wnapp = useSelector((state) => state.apps.edge);
  const [url, setUrl] = useState("https://www.bing.com");
  const [proxyUrl, setProxyUrl] = useState(encodeUrl("https://www.bing.com"));
  const [isTyping, setTyping] = useState(false);
  const [hist, setHist] = useState(["https://www.bing.com", "https://www.bing.com"]);
  const [proxyReady, setProxyReady] = useState(false);
  const [proxyError, setProxyError] = useState("");
  const dispatch = useDispatch();

  const iframes = {
    "https://www.bing.com": "Bing",
    "https://www.google.com": "Google",
    "https://duckduckgo.com": "DuckDuckGo",
    "https://github.com": "GitHub",
    "https://react.dev": "React Docs",
    "https://wikipedia.org": "Wikipedia",
  };

  useEffect(() => {
    let active = true;
    initScramjet()
      .then(() => {
        if (active) setProxyReady(true);
      })
      .catch((error) => {
        console.error("[Puff Desktop] Proxy initialization failed:", error);
        if (active) setProxyError(error?.message || "Proxy initialization failed.");
      });
    return () => {
      active = false;
    };
  }, []);

  const navigateTo = (target) => {
    setUrl(target);
    setProxyUrl(encodeUrl(target));
    setTyping(false);
  };

  const action = (e) => {
    const x = e.target?.dataset?.payload;

    if (x == 0) {
      setProxyUrl(encodeUrl(url));
    } else if (x == 1) {
      setHist([url, "https://www.bing.com"]);
      navigateTo("https://www.bing.com");
    } else if (x == 2) {
      setHist([url, "https://www.google.com"]);
      navigateTo("https://www.google.com");
    } else if (x == 3 && e.key === "Enter") {
      const entered = e.target.value.trim();
      let target = entered;

      try {
        const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(entered)
          ? entered
          : "https://" + entered;
        const parsed = new URL(candidate);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error("Only HTTP and HTTPS pages are supported.");
        }
        if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") {
          throw new Error("Not a web address.");
        }
        target = parsed.href;
      } catch {
        target = "https://www.bing.com/search?q=" + encodeURIComponent(entered);
      }

      setHist([hist[1], target]);
      navigateTo(target);
    } else if (x == 4) {
      navigateTo(hist[0]);
    } else if (x == 5) {
      navigateTo(hist[1]);
    } else if (x == 6) {
      const target = e.currentTarget?.dataset?.url || e.target?.dataset?.url;
      if (target) {
        setHist([url, target]);
        navigateTo(target);
      }
    }
  };

  const typing = (e) => {
    if (!isTyping) {
      setTyping(true);
      setHist([url, url]);
    }
    setUrl(e.target.value);
  };

  useEffect(() => {
    if (wnapp.url) {
      setTyping(false);
      navigateTo(wnapp.url);
      dispatch({ type: "EDGELINK" });
    }
  });

  return (
    <div
      className="edgeBrowser floatTab dpShad"
      data-size={wnapp.size}
      data-max={wnapp.max}
      style={{
        ...(wnapp.size == "cstm" ? wnapp.dim : null),
        zIndex: wnapp.z,
      }}
      data-hide={wnapp.hide}
      id={wnapp.icon + "App"}
    >
      <ToolBar
        app={wnapp.action}
        icon={wnapp.icon}
        size={wnapp.size}
        name="Browser"
        float
      />
      <div className="windowScreen flex flex-col">
        <div className="overTool flex">
          <Icon src={wnapp.icon} width={14} margin="0 6px" />
          <div className="btab">
            <div>New Tab</div>
            <Icon
              fafa="faTimes"
              click={wnapp.action}
              payload="close"
              width={10}
            />
          </div>
        </div>
        <div className="restWindow flex-grow flex flex-col">
          <div className="addressBar w-full h-10 flex items-center">
            <Icon
              className="edgenavicon"
              src="left"
              onClick={action}
              payload={4}
              width={14}
              ui
              margin="0 8px"
            />
            <Icon
              className="edgenavicon"
              src="right"
              onClick={action}
              payload={5}
              width={14}
              ui
              margin="0 8px"
            />
            <Icon
              fafa="faRedo"
              onClick={action}
              payload={0}
              width={14}
              margin="0 8px"
            />
            <Icon
              fafa="faHome"
              onClick={action}
              payload={1}
              width={18}
              margin="0 16px"
            />
            <div className="addCont relative flex items-center">
              <input
                className="w-full h-6 px-4"
                onKeyDown={action}
                onChange={typing}
                data-payload={3}
                value={url}
                placeholder="Type url or a query to search"
                type="text"
              />
              <Icon
                className="z-1 handcr"
                src="google"
                ui
                onClick={action}
                payload={2}
                width={14}
                margin="0 10px"
              />
            </div>
          </div>
          <div className="w-full bookbar py-2">
            <div className="flex">
              {Object.keys(iframes).map((mark, i) => {
                return (
                  <div
                    key={i}
                    className="flex handcr items-center ml-2 mr-1 prtclk"
                    onClick={action}
                    data-payload={6}
                    data-url={mark}
                  >
                    <div className="text-xs">{iframes[mark].trim()}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="siteFrame flex-grow overflow-hidden">
            <LazyComponent show={!wnapp.hide}>
              {!proxyReady ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-sm">
                    {proxyError || "Starting secure proxy connection..."}
                  </div>
                </div>
              ) : (
                <iframe
                  src={!isTyping ? proxyUrl : encodeUrl(hist[0])}
                  id="isite"
                  frameBorder="0"
                  className="w-full h-full"
                  title="site"
                />
              )}
            </LazyComponent>
          </div>
        </div>
      </div>
    </div>
  );
};
