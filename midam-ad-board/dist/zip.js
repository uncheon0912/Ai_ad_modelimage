/* Small, dependency-free ZIP writer. Original image bytes are stored unchanged. */
(() => {
  'use strict';
  const table = Uint32Array.from({length:256},(_,value)=>{
    for(let bit=0;bit<8;bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    return value >>> 0;
  });
  function crc32(bytes) {
    let crc=0xffffffff;
    for(const byte of bytes) crc=table[(crc^byte)&255]^(crc>>>8);
    return (crc^0xffffffff)>>>0;
  }
  function buildZip(files) {
    if(!files.length || files.length>65535) throw new Error('지원되지 않는 파일 개수입니다.');
    const names=new Set(), encoder=new TextEncoder(), locals=[], directory=[];
    let offset=0;
    for(const file of files) {
      if(!file.name || /[\\/]/.test(file.name) || names.has(file.name)) throw new Error('올바르지 않거나 중복된 파일명입니다.');
      names.add(file.name);
      const name=encoder.encode(file.name), bytes=file.bytes;
      if(!(bytes instanceof Uint8Array) || name.length>65535 || bytes.length>0xffffffff) throw new Error('지원되지 않는 파일입니다.');
      const [year,month,day]=(file.date||'1980-01-01').split('-').map(Number);
      const date=((Math.min(2107,Math.max(1980,year))-1980)<<9)|(month<<5)|day;
      const crc=crc32(bytes), local=new Uint8Array(30+name.length+bytes.length), view=new DataView(local.buffer);
      view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x800,true);
      view.setUint16(12,date,true);view.setUint32(14,crc,true);view.setUint32(18,bytes.length,true);view.setUint32(22,bytes.length,true);view.setUint16(26,name.length,true);
      local.set(name,30);local.set(bytes,30+name.length);locals.push(local);
      const central=new Uint8Array(46+name.length), header=new DataView(central.buffer);
      header.setUint32(0,0x02014b50,true);header.setUint16(4,20,true);header.setUint16(6,20,true);header.setUint16(8,0x800,true);
      header.setUint16(14,date,true);header.setUint32(16,crc,true);header.setUint32(20,bytes.length,true);header.setUint32(24,bytes.length,true);header.setUint16(28,name.length,true);header.setUint32(42,offset,true);
      central.set(name,46);directory.push(central);offset+=local.length;
    }
    const directorySize=directory.reduce((sum,part)=>sum+part.length,0);
    if(offset+directorySize+22>0xffffffff) throw new Error('한 번에 묶을 수 있는 용량을 초과했습니다.');
    const end=new Uint8Array(22), endView=new DataView(end.buffer);
    endView.setUint32(0,0x06054b50,true);endView.setUint16(8,files.length,true);endView.setUint16(10,files.length,true);endView.setUint32(12,directorySize,true);endView.setUint32(16,offset,true);
    const result=new Uint8Array(offset+directorySize+22);let cursor=0;
    for(const part of [...locals,...directory,end]){result.set(part,cursor);cursor+=part.length;}
    return result;
  }
  globalThis.MidamZip={buildZip};
})();
