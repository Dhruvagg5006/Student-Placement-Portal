export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Lost'];
export const LEAD_SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Other'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?[\d\s().-]{7,20}$/;

export function validateLead(input) {
  const errors = {};
  const value = {
    name: typeof input?.name === 'string' ? input.name.trim() : '',
    email: typeof input?.email === 'string' ? input.email.trim() : '',
    phone: typeof input?.phone === 'string' ? input.phone.trim() : '',
    company: typeof input?.company === 'string' ? input.company.trim() : '',
    source: typeof input?.source === 'string' ? input.source : '',
    status: typeof input?.status === 'string' ? input.status : 'New',
  };

  for (const field of ['name', 'email', 'phone', 'company', 'source']) {
    if (!value[field]) errors[field] = 'This field is required.';
    else if (value[field].length > 120) errors[field] = 'Must be 120 characters or fewer.';
  }

  if (value.email && !EMAIL_PATTERN.test(value.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (value.phone && !PHONE_PATTERN.test(value.phone)) {
    errors.phone = 'Enter a valid phone number.';
  }
  if (value.source && !LEAD_SOURCES.includes(value.source)) {
    errors.source = 'Choose a valid source.';
  }
  if (!LEAD_STATUSES.includes(value.status)) {
    errors.status = 'Choose a valid status.';
  }

  return { value, errors };
}
