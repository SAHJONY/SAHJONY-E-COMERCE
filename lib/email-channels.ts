export const emailDepartments = [
  ['owner','Executive'],['clientservices','Client Services'],['orders','Orders'],
  ['returns','Returns'],['shipping','Shipping'],['sourcing','Sourcing'],
  ['vendors','Vendor Relations'],['finance','Finance'],['legal','Legal'],
  ['privacy','Privacy'],['security','Security'],['press','Press'],
  ['partnerships','Partnerships'],['careers','Careers'],['no-reply','Transactional'],
] as const;

export type EmailDepartment = typeof emailDepartments[number][0];
export const departmentAddresses = emailDepartments.map(([key,label]) => ({ key,label,address:`${key}@sahjony.com` }));

export function departmentFromRecipients(recipients: string[]) {
  const local = recipients.find((address) => address.toLowerCase().endsWith('@sahjony.com'))?.split('@')[0]?.toLowerCase();
  return emailDepartments.some(([key]) => key === local) ? local : 'clientservices';
}
