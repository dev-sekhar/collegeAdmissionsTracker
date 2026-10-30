// Shared DOM extraction for collection and independent source rechecks.
export function extractHtmlEvidence() {
  const root=document.querySelector('main, #main-content, #main, .unit-content')||document.body;
  const blocks=[];
  for(const value of root.querySelectorAll('[aria-labelledby]')){
    const label=(value.getAttribute('aria-labelledby')||'').split(/\s+/u).map(id=>document.getElementById(id)?.textContent||'').join(' ').trim();
    if(/start|intake|application|deadline|enrol|deposit|interview|test|document/iu.test(label)&&value.innerText?.trim())blocks.push({type:'field',label,value:value.innerText.trim(),text:`${label}: ${value.innerText.trim()}`,context:document.querySelector('h1')?.textContent||document.title});
  }
  for(const term of root.querySelectorAll('dt')){
    const definition=term.nextElementSibling;
    if(definition?.tagName==='DD')blocks.push({type:'text',text:`${term.innerText} ${definition.innerText}`.replace(/\s+/gu,' ').trim(),context:document.querySelector('h1')?.textContent||document.title});
  }
  for(const row of root.querySelectorAll('.views-row')) {
    const intake=row.querySelector('h4')?.textContent?.trim();
    if(!intake||!/intake/i.test(intake))continue;
    let category='Not specified';
    for(const child of row.children) {
      if(child.querySelector('h5'))category=child.querySelector('h5').textContent.trim();
      const label=child.querySelector('.views-label')?.textContent.trim();
      const value=child.querySelector('.field-content')?.textContent.trim();
      if(label&&value)blocks.push({type:'field',label,value,context:intake,category});
    }
  }
  for(const table of root.querySelectorAll('table')) {
    const rows=[...table.querySelectorAll('tr')].map(row=>[...row.querySelectorAll(':scope > th,:scope > td')].map(cell=>cell.innerText.trim()));
    const index=rows.findIndex(cells=>cells.some(cell=>/opening date|closing date|application deadline|intake/i.test(cell)));
    if(index>=0)for(const cells of rows.slice(index+1))blocks.push({type:'table',headers:rows[index],cells,context:table.querySelector('caption')?.textContent||'Table context requires review'});
  }
  for(const node of root.querySelectorAll('p,li,tr')) {
    if(node.closest('header,nav,footer')||node.querySelector('p,li,table'))continue;
    const text=node.innerText?.trim();
    if(text&&text.length<1600)blocks.push({type:'text',text,context:document.querySelector('h1')?.textContent||document.title});
  }
  return {blocks,links:[...root.querySelectorAll('a[href]')].map(a=>({href:a.href,text:a.textContent.trim()})),headings:[...[...document.querySelectorAll('h1')].map(h=>h.textContent.trim()),document.title.split('|')[0].trim()]};
}
