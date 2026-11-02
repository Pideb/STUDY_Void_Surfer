import registry from '../../docs/management/releases.json' with { type: 'json' };
export const FEEDBACK_AIRCRAFT_POLICY=Object.freeze({temporaryEnabled:true,expiresAtBase:'0.3',notice:'다음 버전까지 임시 해금'});
export function isTemporaryAircraftUnlock({versionBase=registry.versionBase,temporaryUnlock=FEEDBACK_AIRCRAFT_POLICY.temporaryEnabled}={}) {
  return temporaryUnlock && ['0.1','0.2'].includes(versionBase);
}
export function getAircraftAccess({guestMode=false,bestScore=0,versionBase=registry.versionBase,temporaryUnlock=true}={}) {
  const temporary=isTemporaryAircraftUnlock({versionBase,temporaryUnlock});
  const allowedIds=temporary?['default','aegis','velocity']:guestMode?['default']:['default',...(bestScore>=50?['aegis']:[]),...(bestScore>=100?['velocity']:[])];
  return {allowedIds,temporary,notice:temporary?FEEDBACK_AIRCRAFT_POLICY.notice:null};
}
