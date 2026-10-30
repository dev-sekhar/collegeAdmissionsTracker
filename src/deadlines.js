export const admissionStages = [
  ['opening', 'Applications open'], ['application', 'Application submission'],
  ['documents', 'Supporting documents'], ['tests', 'Entrance tests / scores'],
  ['interview', 'Interview'], ['acceptance', 'Offer acceptance'],
  ['deposit', 'Deposit payment'], ['enrolment', 'Enrolment'],
];
export function stageFor(text) {
  if (/scholarship|accommodation|financial aid/iu.test(text)) return null;
  if (/transcript|referee|supporting document|document.{0,25}(deadline|submit)|submit.{0,25}document/iu.test(text)) return 'documents';
  if (/(test|score|ielts|toefl|gre|gmat).{0,30}(deadline|submit|registration)/iu.test(text)) return 'tests';
  if (/interview.{0,30}(date|deadline|book|schedule|held)/iu.test(text)) return 'interview';
  if (/(accept.{0,25}offer|offer.{0,25}accept|respond.{0,25}offer)/iu.test(text)) return 'acceptance';
  if (/deposit.{0,30}(pay|due|deadline)|pay.{0,25}deposit/iu.test(text)) return 'deposit';
  if (/(enrol|enroll|registrat).{0,30}(date|deadline|period|complete)/iu.test(text)) return 'enrolment';
  if (/(application|admission).{0,25}(open|start)|opening date/iu.test(text)) return 'opening';
  if (/(application|applicant|apply|admission).{0,35}(deadline|clos|period)|closing date|application submission/iu.test(text)) return 'application';
  return null;
}
const months = 'January|February|March|April|May|June|July|August|September|October|November|December';
export function dateExpressions(text) {
  // Retain original date strings. No year, timezone or midnight cutoff is inferred.
  const pattern = new RegExp(`\\b(?:\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${months})(?:\\s+\\d{4})?|(?:${months})\\s+\\d{1,2}(?:st|nd|rd|th)?(?!\\d)(?:,?\\s+\\d{4})?|\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\.\\d{1,2}\\.(?:\\d{4})?)(?![\\p{L}\\p{N}])`, 'giu');
  return [...new Set(text.match(pattern) || [])];
}
export function candidateRecord({ stage, value, evidence, context = '', applicantCategory = 'Not specified', sourceUrl, checkedAt, extraction = 'HTML' }) {
  if (!stage || !value || !evidence) return null;
  const relative = /within\s+\d+\s+(?:working\s+)?days|before submitting|stated in.{0,25}offer|offer letter|rolling admission/iu.test(value);
  const dates = dateExpressions(value);
  if (!dates.length && !relative && !/not yet announced|to be announced|TBA/iu.test(value)) return null;
  return { stage, value: value.trim(), dateExpressions: dates, evidence: evidence.trim(), context: context.trim(), applicantCategory, sourceUrl, checkedAt, extraction, status: 'Needs verification', kind: relative ? 'Relative rule / rolling' : dates.length > 1 ? 'Date window or multiple dates' : dates.length ? 'Published date text' : 'Unpublished', years: [...new Set(`${context} ${value}`.match(/\b20\d{2}\b/gu) || [])], timezone: null };
}
export function extractCandidates(blocks, metadata) {
  const candidates = new Map();
  function add(stage, value, evidence, context, category) {
    const record = candidateRecord({ stage, value, evidence, context, applicantCategory: category, ...metadata });
    if (!record) return;
    const key = [record.stage,record.value,record.context,record.applicantCategory,record.sourceUrl].join('|');
    candidates.set(key, record);
  }
  for (const block of blocks) {
    if (block.type === 'field') add(stageFor(block.label), block.value, `${block.label}: ${block.value}`, block.context, block.category);
    else if (block.type === 'table') {
      const headers = block.headers || [];
      if (headers.some(header => dateExpressions(header).length)) continue;
      const contextIndex = headers.findIndex(header => /intake|entry|commencement|semester/iu.test(header));
      const categoryIndex = headers.findIndex(header => /applicant|citizen|nationality|category/iu.test(header));
      headers.forEach((header, index) => {
        const stage = stageFor(header);
        if (stage && block.cells[index]) add(stage, block.cells[index], `${headers.join(' | ')}\n${block.cells.join(' | ')}`, contextIndex >= 0 ? block.cells[contextIndex] : block.context, categoryIndex >= 0 ? block.cells[categoryIndex] : 'Not specified');
      });
    } else if (block.text && block.text.length < 1600) {
      const stage = stageFor(block.text);
      // A heading alone cannot assign an unrelated date (e.g. a webinar) to a stage.
      add(stage, block.text, block.text, block.context, 'Not specified');
    }
  }
  return [...candidates.values()];
}
