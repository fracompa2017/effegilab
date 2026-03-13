import Script from "next/script";

import { createClient } from "@/lib/supabase/server";

type IntegrationRow = {
  name: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
};

function configValue(config: Record<string, unknown> | null, key: string) {
  const value = config?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function PixelManager() {
  const supabase = await createClient();
  const { data } = await supabase.from("integrations").select("name,enabled,config").eq("enabled", true);

  const rows = ((data ?? []) as IntegrationRow[]).reduce<Record<string, IntegrationRow>>((acc, row) => {
    acc[row.name] = row;
    return acc;
  }, {});

  const facebookPixel = rows.facebook_pixel;
  const facebookPixelId = configValue(facebookPixel?.config ?? null, "pixel_id");

  const ga4 = rows.google_analytics;
  const ga4MeasurementId = configValue(ga4?.config ?? null, "measurement_id");

  const gtm = rows.google_tag_manager;
  const gtmContainerId = configValue(gtm?.config ?? null, "container_id");

  const tiktok = rows.tiktok_pixel;
  const tiktokPixelId = configValue(tiktok?.config ?? null, "pixel_id");

  return (
    <>
      {facebookPixel?.enabled && facebookPixelId ? (
        <>
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${facebookPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${facebookPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}

      {ga4?.enabled && ga4MeasurementId ? (
        <>
          <Script
            id="ga4-lib"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`}
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4MeasurementId}');
            `}
          </Script>
        </>
      ) : null}

      {gtm?.enabled && gtmContainerId ? (
        <>
          <Script id="gtm-init" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmContainerId}');
            `}
          </Script>
          <noscript>
            <iframe
              title="gtm"
              src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      ) : null}

      {tiktok?.enabled && tiktokPixelId ? (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
              ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};
              ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
              var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;
              var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${tiktokPixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      ) : null}
    </>
  );
}
