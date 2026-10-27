'use strict';
const $ = (selector) => document.querySelector(selector);
const requestedView = new URLSearchParams(location.search).get('view');
const requestedCollection = new URLSearchParams(location.search).get('category');
const state = { assets: [], filtered: [], view: ['board','mini','story'].includes(requestedView) ? requestedView : 'board', collection: ['ai-models','EBC','latest'].includes(requestedCollection) ? requestedCollection : 'all', activeId: null };
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const formatDate = date => date.replaceAll('-', '.');
const pad = number => String(number).padStart(2, '0');
const dialog = $('#detail');
let opener = null;
const selectedIds = new Set();
let downloadBusy = false;

function updateDownloadControls() {
  const count=selectedIds.size;
  $('#download-selected').textContent=`선택 다운로드 (${count})`;
  $('#download-selected').disabled=downloadBusy || !count;
  $('#clear-selection').disabled=downloadBusy || !count;
  const dateCount=state.assets.filter(asset=>asset.date===$('#download-date').value).length;
  $('#download-date-all').textContent=`날짜별 전체 다운로드 (${dateCount}장) ↓`;
  $('#download-date-all').disabled=downloadBusy || !dateCount;
  $('#download-date').disabled=downloadBusy || !state.assets.length;
  const visibleCount=state.filtered.filter(asset=>selectedIds.has(asset.id)).length;
  $('#select-visible').checked=state.filtered.length>0 && visibleCount===state.filtered.length;
  $('#select-visible').indeterminate=visibleCount>0 && visibleCount<state.filtered.length;
  $('#select-visible').disabled=downloadBusy || !state.filtered.length;
  document.querySelectorAll('[data-select]').forEach(input=>input.disabled=downloadBusy);
}

async function downloadBundle(assets, filename) {
  if(downloadBusy || !assets.length) return;
  downloadBusy=true;updateDownloadControls();
  const status=$('#download-status');status.classList.remove('error');
  status.textContent=`원본 ${assets.length}장을 준비하고 있습니다… (0/${assets.length})`;
  try {
    let completed=0;
    const results=await Promise.allSettled(assets.map(async asset=>{
      const response=await fetch(asset.image);
      if(!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('이미지 응답 오류');
      const bytes=new Uint8Array(await response.arrayBuffer());
      if(!bytes.length) throw new Error('빈 이미지');
      completed++;status.textContent=`원본 ${assets.length}장을 준비하고 있습니다… (${completed}/${assets.length})`;
      return {name:asset.id+'_'+asset.image.split('/').at(-1),bytes,date:asset.date};
    }));
    if(results.some(result=>result.status==='rejected')) throw new Error('이미지 응답 오류');
    const zip=MidamZip.buildZip(results.map(result=>result.value));
    const url=URL.createObjectURL(new Blob([zip],{type:'application/zip'}));
    const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    status.textContent=`${assets.length}장 ZIP 다운로드를 시작했습니다. 브라우저의 다운로드 목록을 확인하세요.`;
  } catch(error) {
    status.classList.add('error');status.textContent='원본 이미지를 모두 가져오지 못해 ZIP을 만들지 않았습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.';
  } finally {downloadBusy=false;updateDownloadControls();}
}

function syncCategoryFilters() {
  const pool = state.assets.filter(asset => state.collection === 'ai-models' ? asset.category === 'ai-models' : state.collection === 'EBC' ? asset.brand === 'EBC' : true);
  for (const [id,field,label] of [['industry','industry','모든 업종'],['style','concept','모든 스타일']]) {
    const select = $('#'+id), previous = select.value;
    const values = [...new Set(pool.map(asset=>asset[field]))];
    select.replaceChildren(new Option(label,''), ...values.map(value=>new Option(value,value)));
    if (values.includes(previous)) select.value = previous;
  }
}

function syncLibraryMetadata() {
  const latestDate = state.assets.reduce((latest,asset) => asset.date > latest ? asset.date : latest, '');
  for (const button of document.querySelectorAll('[data-collection]')) {
    const collection = button.dataset.collection;
    const count = state.assets.filter(asset => collection === 'all' || (collection === 'latest' ? asset.date === latestDate : collection === 'ai-models' ? asset.category === 'ai-models' : asset.brand === collection)).length;
    button.querySelector('.nav-count').textContent = pad(count);
  }
  syncCategoryFilters();
  const previousDate=$('#download-date').value;
  const dates=[...new Set(state.assets.map(asset=>asset.date))].sort().reverse();
  $('#download-date').replaceChildren(...dates.map(date=>new Option(formatDate(date)+` (${state.assets.filter(asset=>asset.date===date).length}장)`,date)));
  if(dates.includes(previousDate)) $('#download-date').value=previousDate;
  document.querySelector('.archive-stamp strong').textContent = state.assets.length ? '001—'+String(state.assets.length).padStart(3,'0') : '000';
  document.querySelector('.archive-stamp small').textContent = formatDate(latestDate)+' UPDATE';
  const ebcCount = state.assets.filter(asset=>asset.brand==='EBC').length;
  document.querySelector('.banner-number').innerHTML = pad(ebcCount)+' <small>CREATIVES</small>';
  const brandCount = new Set(state.assets.map(asset=>asset.brand)).size;
  document.querySelector('footer>span:last-child').textContent = `CREATIVE ARCHIVE · ${pad(brandCount)} COLLECTION / ${pad(state.assets.length)} ASSETS`;
}

function productGroupKey(asset) {
  return asset.productImage ? asset.brand+'::'+asset.productImage : asset.id;
}

function renderModelProject() {
  const asset=state.filtered.find(item=>item.category==='ai-models') || [...state.assets].filter(item=>item.category==='ai-models').sort((a,b)=>(b.createdAt||b.date).localeCompare(a.createdAt||a.date))[0];
  if(!asset) return;
  const group=state.assets.filter(item=>item.category==='ai-models' && productGroupKey(item)===productGroupKey(asset));
  const panel=$('#model-project'), link=panel.querySelector('.product-reference'), image=link.querySelector('img');
  link.href=asset.productImage;image.src=asset.productImage;image.alt=asset.productName+' · 모델 제작에 사용한 제품 원본';
  $('#model-project-title').textContent=asset.productName;
  panel.querySelector('.project-company').textContent=asset.brand+' · 제품 사용 프로젝트';
  panel.querySelector('.eyebrow').textContent='VIRTUAL MODEL / PRODUCT REFERENCE';
  panel.querySelector('.model-specs').innerHTML=[...new Set(group.map(item=>item.modelSpec)),group.length+'개 모델 이미지'].map(spec=>'<span>'+escapeHTML(spec)+'</span>').join('');
  panel.querySelector('.model-project-info > p:not(.eyebrow)').textContent=asset.productSummary || '같은 제품의 원본 사진과 AI 모델 결과를 비교하세요. 제품 원본 카드 바로 뒤에 관련 모델들이 표시됩니다.';
  const references=asset.productReferences||[{label:'제품 원본',image:asset.productImage}];
  panel.querySelector('.product-views').innerHTML=references.map(reference=>`<a href="${escapeHTML(reference.image)}" target="_blank" rel="noopener">${escapeHTML(reference.label)} ↗</a>`).join('');
}

function renderProductCard(asset,modelCount) {
  const name=escapeHTML(asset.productName||'참고 제품');
  const image=escapeHTML(asset.productImage);
  return `<article class="creative-card product-source-card" aria-label="${name} 제품 원본"><a class="image-button" href="${image}" target="_blank" rel="noopener" aria-label="${name} 제품 원본 확대"><img src="${image}" alt="${name} · 모델 제작에 사용한 제품 원본" loading="eager" style="aspect-ratio:${asset.width||1122}/${asset.height||1402}"><span class="card-number">제품 원본</span><span class="zoom-hint" aria-hidden="true">↗</span></a><div class="card-body"><div class="card-top"><span class="brand-pill">REFERENCE</span><span class="source-label">제공된 제품</span></div><a class="card-title" href="${image}" target="_blank" rel="noopener">${name}</a><p class="card-style"><span class="style-dot"></span>이 제품의 모델 ${modelCount}장 →</p><p class="card-description">모델 이미지 제작에 사용한 제품 사진입니다. 바로 뒤의 착용 결과와 비교하세요.</p><div class="card-bottom"><span>모델 이미지와 구분된 참고 원본</span><a class="card-download" href="${image}" download aria-label="${name} 제품 원본 다운로드">↓</a></div></div></article>`;
}

function render() {
  syncCategoryFilters();
  const query = $('#search').value.trim().toLocaleLowerCase('ko');
  const industry = $('#industry').value;
  const style = $('#style').value;
  const sort = $('#sort').value;
  const latestDate = state.assets.reduce((latest,asset) => asset.date > latest ? asset.date : latest, '');
  const isModels = state.collection === 'ai-models';
  $('#model-project').hidden = !isModels;
  document.querySelector('.filter-group').hidden = isModels && !state.assets.some(asset=>asset.category==='ai-models');
  document.querySelector('.collection-banner').hidden = isModels;
  document.querySelectorAll('[data-collection]').forEach(button=>button.classList.toggle('active',button.dataset.collection===state.collection));
  state.filtered = state.assets.filter(asset => {
    const haystack = [asset.brand,asset.title,asset.concept,asset.industry,asset.date,...asset.keywords].join(' ').toLocaleLowerCase('ko');
    return (!query || haystack.includes(query)) && (!industry || asset.industry === industry) && (!style || asset.concept === style) && (state.collection !== 'EBC' || asset.brand === 'EBC') && (state.collection !== 'latest' || asset.date === latestDate) && (state.collection !== 'ai-models' || asset.category === 'ai-models');
  }).sort((a,b) => sort === 'name' ? a.title.localeCompare(b.title,'ko') : sort === 'oldest' ? (a.createdAt||a.date).localeCompare(b.createdAt||b.date) || a.id.localeCompare(b.id) : (b.createdAt||b.date).localeCompare(a.createdAt||a.date) || a.id.localeCompare(b.id));
  const productGroups=new Map();
  if(isModels) {
    for(const asset of state.filtered) {
      const key=productGroupKey(asset);
      if(!productGroups.has(key)) productGroups.set(key,[]);
      productGroups.get(key).push(asset);
    }
    state.filtered=[...productGroups.values()].flat();
  }
  const shownProducts=new Set();
  if(isModels) renderModelProject();
  $('#gallery').className = 'gallery' + (state.view === 'board' ? '' : ' ' + state.view);
  $('#gallery').innerHTML = state.filtered.map(asset => {
    const index = state.assets.findIndex(item => item.id === asset.id) + 1;
    const groupKey=productGroupKey(asset);
    let productCard='';
    if(isModels && asset.productImage && !shownProducts.has(groupKey)) {
      shownProducts.add(groupKey);
      productCard=renderProductCard(asset,productGroups.get(groupKey).length);
    }
    return productCard + `<article class="creative-card${selectedIds.has(asset.id) ? ' is-selected' : ''}"><span class="story-date" aria-hidden="true"></span><button class="image-button" data-open="${escapeHTML(asset.id)}" aria-label="${escapeHTML(asset.title)} 상세 보기"><img src="${escapeHTML(asset.image)}" alt="${escapeHTML(asset.brand+' '+asset.concept+' 이미지: '+asset.title)}" width="${asset.width||1122}" height="${asset.height||1402}" style="aspect-ratio:${asset.width||1122}/${asset.height||1402}" loading="eager"><span class="card-number">${asset.category === 'ai-models' ? 'MODEL '+pad(asset.modelNumber) : 'CREATIVE '+pad(index)}</span><span class="zoom-hint" aria-hidden="true">↗</span></button><label class="selection-control"><input type="checkbox" data-select="${escapeHTML(asset.id)}" aria-label="${escapeHTML(asset.title)} 선택" ${selectedIds.has(asset.id) ? 'checked' : ''} ${downloadBusy ? 'disabled' : ''}></label><div class="card-body"><div class="card-top"><span class="brand-pill">${escapeHTML(asset.brand)}</span><time datetime="${asset.date}">${formatDate(asset.date)}</time></div><button class="card-title" data-open="${escapeHTML(asset.id)}">${escapeHTML(asset.shortTitle)}</button><p class="card-style"><span class="style-dot"></span>${escapeHTML(asset.concept)}</p><p class="card-description">${escapeHTML(asset.description)}</p><div class="tags">${asset.keywords.map(keyword=>`<button class="tag tag-button" data-keyword="${escapeHTML(keyword)}" aria-label="${escapeHTML(keyword)} 키워드로 검색">#${escapeHTML(keyword)}</button>`).join('')}</div><div class="card-bottom"><span>${escapeHTML(asset.industry)}</span><div class="palette" aria-label="주요 색상">${asset.palette.map(color=>`<span style="background:${color}" title="${color}"></span>`).join('')}</div><a class="card-download" href="${escapeHTML(asset.image)}" download aria-label="${escapeHTML(asset.title)} PNG 다운로드">↓</a></div></div></article>`;
  }).join('');
  $('#empty').hidden = state.filtered.length > 0;
  document.querySelector('#empty h3').textContent = '일치하는 소재가 없어요';
  document.querySelector('#empty p').textContent = '다른 키워드로 검색하거나 필터를 초기화해 보세요.';
  $('#result-count').textContent = state.filtered.length;
  $('#filter-summary').textContent = isModels ? `${query || industry || style ? '필터 결과' : '전체 컬렉션'} · 모델 ${state.filtered.length}장 · 제품 원본 ${shownProducts.size}장` : `${query || industry || style ? '필터 결과' : '전체 컬렉션'} · ${state.filtered.length}개의 소재`;
  $('#reset').hidden = !(query || industry || style || state.collection !== 'all');
  $('#collection-title').textContent = isModels ? '업체별 AI 모델' : state.collection === 'EBC' ? 'EBC 컬렉션' : state.collection === 'latest' ? '최근 제작' : '전체 소재';
  updateDownloadControls();
}

function reset() {
  $('#search').value = '';
  $('#industry').value = '';
  $('#style').value = '';
  $('#sort').value = 'newest';
  state.collection = 'all';
  const url = new URL(location.href);url.searchParams.delete('category');history.replaceState(null,'',url);
  document.querySelectorAll('[data-collection]').forEach(button => button.classList.toggle('active', button.dataset.collection === 'all'));
  render();
}

function showAsset(id, trigger) {
  const asset = state.assets.find(item => item.id === id);
  if (!asset) return;
  state.activeId = id;
  if (!dialog.open) opener = trigger || document.activeElement;
  $('#detail-image').src = asset.image;
  $('#detail-image').alt = asset.brand+' '+asset.concept+' 이미지: '+asset.title;
  $('#detail-title').textContent = asset.title;
  $('#detail-brand').textContent = asset.brand;
  $('#detail-description').textContent = asset.description;
  const isModel = asset.category === 'ai-models';
  const metadata = [['제작일',formatDate(asset.date)],['업종',asset.industry],['스타일',asset.concept],['사용 채널',asset.format],['원본 크기',asset.dimensions]];
  if (isModel) metadata.push(['업체',asset.brand],['상품',asset.productName],['모델 조건',asset.modelSpec]);
  if (asset.occupation) metadata.push(['장면 설정',asset.occupation]);
  $('#detail-meta').innerHTML = metadata.map(([key,value]) => `<dt>${escapeHTML(key)}</dt><dd>${escapeHTML(value)}</dd>`).join('');
  $('#detail-product').hidden = !isModel;
  if (isModel) {$('#detail-product').href=asset.productImage;$('#detail-product-image').src=asset.productImage;document.querySelector('#detail-product span').innerHTML='<strong>제품 원본과 비교</strong>'+escapeHTML(asset.productName)+' · 원본 확대 ↗';}
  document.querySelector('.detail-copy h3').textContent = isModel ? 'MODEL DIRECTION' : 'MAIN COPY';
  document.querySelector('.asset-note').textContent = isModel ? '가상의 성인 모델로 제작한 AI 착장 이미지입니다. 상품 세부는 원본과 비교해 확인하세요.' : 'AI 생성 광고 시안입니다. EBC 표기는 텍스트 워드마크이며, 기기 화면은 설명용 이미지입니다.';
  $('#detail-tags').innerHTML = asset.keywords.map(keyword => `<span class="tag">#${escapeHTML(keyword)}</span>`).join('');
  $('#detail-copy').textContent = asset.copy;
  $('#download').href = asset.image;
  $('#download').download = asset.image.split('/').at(-1);
  $('#original').href = asset.image;
  const index = state.filtered.findIndex(item => item.id === id);
  $('#detail-position').textContent = `${pad(index+1)} / ${pad(state.filtered.length)}`;
  $('#prev').hidden = state.filtered.length <= 1;
  $('#next').hidden = state.filtered.length <= 1;
  if (!dialog.open) { dialog.showModal(); document.body.style.overflow = 'hidden'; }
  const url = new URL(location.href);url.hash = id;history.replaceState(null,'',url);
}

function step(direction) {
  const index = state.filtered.findIndex(asset => asset.id === state.activeId);
  const next = state.filtered[(index + direction + state.filtered.length) % state.filtered.length];
  if (next) showAsset(next.id);
}

$('#gallery').addEventListener('click', event => {
  const open = event.target.closest('[data-open]');
  if (open) showAsset(open.dataset.open, open);
  const keyword = event.target.closest('[data-keyword]');
  if (keyword) { $('#search').value = keyword.dataset.keyword; render(); }
});
$('#gallery').addEventListener('change',event=>{
  const input=event.target.closest('[data-select]');
  if(!input || downloadBusy) return;
  if(input.checked) selectedIds.add(input.dataset.select); else selectedIds.delete(input.dataset.select);
  input.closest('.creative-card').classList.toggle('is-selected',input.checked);
  updateDownloadControls();
});
$('#select-visible').addEventListener('change',event=>{
  for(const asset of state.filtered) {if(event.target.checked) selectedIds.add(asset.id);else selectedIds.delete(asset.id);}
  render();
});
$('#clear-selection').addEventListener('click',()=>{selectedIds.clear();render();});
$('#download-date').addEventListener('change',updateDownloadControls);
$('#download-date-all').addEventListener('click',()=>{
  const date=$('#download-date').value;
  const assets=state.assets.filter(asset=>asset.date===date);
  downloadBundle(assets,`미담릴공장_${date}_전체_${assets.length}장.zip`);
});
$('#download-selected').addEventListener('click',()=>{
  const assets=state.assets.filter(asset=>selectedIds.has(asset.id));
  downloadBundle(assets,`미담릴공장_선택_${assets.length}장.zip`);
});
$('#search').addEventListener('input',render);
['industry','style','sort'].forEach(id => $('#'+id).addEventListener('change',render));
$('#reset').addEventListener('click',reset);
$('#empty-reset').addEventListener('click',reset);
document.querySelectorAll('[data-collection]').forEach(button => button.addEventListener('click',()=>{
  state.collection = button.dataset.collection;
  $('#search').value = '';$('#industry').value='';$('#style').value='';
  if (state.collection === 'latest') $('#sort').value = 'newest';
  const url = new URL(location.href);
  if (state.collection === 'all') url.searchParams.delete('category'); else url.searchParams.set('category',state.collection);
  history.replaceState(null,'',url);
  document.querySelectorAll('[data-collection]').forEach(item => item.classList.toggle('active',item === button));
  render();
}));
function setView(view) {
  state.view = view;
  for (const mode of ['board','mini','story']) {
    $('#'+mode+'-view').classList.toggle('selected', view === mode);
    $('#'+mode+'-view').setAttribute('aria-pressed', String(view === mode));
  }
  const url = new URL(location.href);
  if (view === 'board') url.searchParams.delete('view'); else url.searchParams.set('view', view);
  history.replaceState(null,'',url);
  render();
}
$('#board-view').addEventListener('click',()=>setView('board'));
$('#mini-view').addEventListener('click',()=>setView('mini'));
$('#story-view').addEventListener('click',()=>setView('story'));
$('#close-detail').addEventListener('click',()=>dialog.close());
$('#prev').addEventListener('click',()=>step(-1));$('#next').addEventListener('click',()=>step(1));
dialog.addEventListener('click',event=>{if(event.target === dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';history.replaceState(null,'',location.pathname+location.search);if(opener?.isConnected)opener.focus();});
document.addEventListener('keydown',event=>{if(dialog.open){if(event.key==='ArrowRight')step(1);if(event.key==='ArrowLeft')step(-1);}else if(event.key==='/'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){event.preventDefault();$('#search').focus();}});
fetch('assets.json').then(response=>{if(!response.ok)throw new Error('asset load');return response.json();}).then(assets=>{state.assets=assets;syncLibraryMetadata();setView(state.view);const id=location.hash.slice(1);if(assets.some(asset=>asset.id===id))showAsset(id);}).catch(()=>{$('#gallery').innerHTML='<div class="load-error" role="alert">소재 목록을 불러오지 못했습니다. 페이지를 새로고침해 주세요.</div>';$('#result-count').textContent='—';});
