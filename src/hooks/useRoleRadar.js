import { useEffect, useState } from 'react';
import { APIService } from '../services/apiService';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { DOMUtils } from '../utils/domUtils';

export function useRoleRadar(selection) {
  const [radarRole, setRadarRole] = useState(selection?.detectedRole || null);
  const [domRole, setDomRole] = useState(null);
  const resolvedMid = selection?.mid;

  useEffect(() => {
    let mounted = true;
    if (!selection?.cid || !selection?.mid) return () => { mounted = false; };
    const controller = new AbortController();
    APIService.getMessageInfo(selection.cid, selection.mid, controller.signal)
      .then(({ message }) => {
        if (!mounted || !message?.role) return;
        setRadarRole(message.role);
        const current = useRuntimeStore.getState().selection;
        if (current?.mid === selection.mid && current.detectedRole !== message.role) {
          useRuntimeStore.getState().setSelection({ ...current, detectedRole: message.role });
        }
      })
      .catch(() => {});
    return () => { mounted = false; controller.abort(); };
  }, [selection?.cid, selection?.mid]);

  useEffect(() => {
    setRadarRole(selection?.detectedRole || null);
    if (!resolvedMid) {
      setDomRole(null);
      return;
    }
    const msgDOMEl = DOMUtils.messageElementForMid(resolvedMid);
    if (!msgDOMEl) {
      setDomRole(null);
      return;
    }
    const roleAttr = msgDOMEl.getAttribute('data-message-role');
    if (roleAttr) setDomRole(roleAttr);
    else if (msgDOMEl.classList.contains('mari-message-user') || msgDOMEl.closest('.mari-message-user') !== null) setDomRole('user');
    else if (msgDOMEl.classList.contains('mari-message-assistant') || msgDOMEl.closest('.mari-message-assistant') !== null) setDomRole('assistant');
    else setDomRole(null);
  }, [resolvedMid, selection?.detectedRole]);

  return radarRole || domRole || null;
}
