(function () {
  try {
    const url = new URL(location.href);
    const tracking = /^(utm_source|utm_medium|utm_campaign|utm_term|utm_content|utm_id|utm_source_platform|utm_creative_format|utm_marketing_tactic)$/i;
    const keys = [...url.searchParams.keys()].filter(key => tracking.test(key));
    if (!keys.length) return;
    for (const key of keys) url.searchParams.delete(key);
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  } catch (_) { /* Address cleanup must never block the portal. */ }
})();
