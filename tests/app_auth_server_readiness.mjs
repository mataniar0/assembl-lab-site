/* Read-only public Supabase Auth configuration audit.
 * This uses the publishable (public) key only. No signups, passwords, JWTs,
 * user records, provider calls, uploads or DB mutations. Safe to run on CI.
 */
import {CONFIG} from '../app/cloud-api-core.mjs';
import {fileURLToPath} from 'node:url';

export async function auditPublicAuthSettings({fetchImpl=fetch}={}){
  const response=await fetchImpl(CONFIG.endpoint+'/auth/v1/settings',{
    method:'GET',headers:{apikey:CONFIG.publishableKey,accept:'application/json'},
    cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12000)
  });
  if(!response.ok)throw new Error('PUBLIC_AUTH_SETTINGS_UNAVAILABLE_'+response.status);
  const data=await response.json();
  if(!data||typeof data.disable_signup!=='boolean'||!data.external||typeof data.external!=='object')
    throw new Error('UNEXPECTED_PUBLIC_AUTH_SETTINGS');
  const signupDisabled=data.disable_signup===true;
  const emailEnabled=data.external.email===true;
  const emailConfirmationRequired=data.mailer_autoconfirm===false;
  const anonDisabled=data.external.anonymous_users!==true;
  return Object.freeze({
    project:'assembl-lab-dev',
    scope:'PUBLIC_AUTH_SETTINGS_ONLY',
    method:'GET',
    status:signupDisabled&&emailEnabled&&emailConfirmationRequired&&anonDisabled?'PASS':'NO_GO',
    signup:signupDisabled?'DISABLED':'ENABLED',
    email_auth:emailEnabled?'ENABLED':'DISABLED',
    email_confirmation:emailConfirmationRequired?'REQUIRED':'NOT_CONFIRMED_REQUIRED',
    anonymous_signup:anonDisabled?'DISABLED':'ENABLED',
    user_accounts_tested:0,
    credentials_used:false,
    tokens_used:false,
    data_mutated:false,
    note:'PUBLIC_CONFIGURATION_AUDIT_ONLY_NOT_TWO_USER_JWT_E2E'
  });
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  auditPublicAuthSettings()
    .then(result=>process.stdout.write(JSON.stringify(result,null,2)+'\n'))
    .catch(error=>{
      // Never print headers or response bodies; statuses only.
      process.stderr.write('Auth public readiness probe unavailable: '+error.message+'\n');
      process.exitCode=1;
    });
}
