'use strict';
// Own booking module (23 Nov 2026, owner decisions): Monday-Friday, starts 09:00-16:00 Brussels time, one hour,
// at least 24 hours ahead, Belgian public holidays closed, blocked periods and existing appointments excluded.
// The rules file is the same one the Edge Function deploys; fixtures below are hand-calculated.
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const load=()=>import(path.resolve(__dirname,'..','supabase','functions','booking','rules.js'));

test('Brussels wall-clock time converts correctly in winter and summer time',async()=>{
  const r=await load();
  assert.equal(r.brussels(2026,11,24,9).toISOString(),'2026-11-24T08:00:00.000Z');
  assert.equal(r.brussels(2027,6,15,9).toISOString(),'2027-06-15T07:00:00.000Z');
  assert.equal(r.brussels(2027,3,29,9).toISOString(),'2027-03-29T07:00:00.000Z','Monday after the switch to summer time');
});

test('Belgian public holidays, including the moving Easter feasts',async()=>{
  const h=(await load()).holidays(2027);
  for(const d of ['2027-01-01','2027-03-29','2027-05-01','2027-05-06','2027-05-17','2027-07-21','2027-08-15','2027-11-01','2027-11-11','2027-12-25'])assert.ok(h.has(d),d);
  assert.equal(h.size,10);
});

test('slots: weekdays only, 09:00 to 16:00 starts, 24 hours notice',async()=>{
  const r=await load();
  const now=new Date('2026-11-23T20:00:00Z'); // Monday 21:00 in Brussels, so Tuesday is too close
  const s=r.freeSlots(now,[],7);
  assert.equal(s[0].start,'2026-11-25T08:00:00.000Z');assert.equal(s[0].date,'2026-11-25');assert.equal(s[0].time,'09:00');
  assert.deepEqual([...new Set(s.map(x=>x.date))],['2026-11-25','2026-11-26','2026-11-27','2026-11-30'],'no weekend');
  assert.equal(s.length,32);assert.equal(s[7].time,'16:00');
  const tue=r.freeSlots(new Date('2026-11-23T10:30:00Z'),[],1);
  assert.deepEqual(tue.map(x=>x.time),['12:00','13:00','14:00','15:00','16:00'],'Monday 11:30 Brussels: Tuesday from 12:00');
});

test('slots: holidays, appointments and blocked periods are not offered',async()=>{
  const r=await load();
  const now=new Date('2026-11-06T12:00:00Z');
  assert.ok(!r.freeSlots(now,[],10).some(x=>x.date==='2026-11-11'),'Armistice Day');
  const busy=[{start_at:'2026-11-12T09:00:00Z',end_at:'2026-11-12T10:00:00Z'},{start_at:'2026-11-13T07:30:00Z',end_at:'2026-11-13T23:00:00Z'}];
  const s=r.freeSlots(now,busy,10);
  assert.ok(!s.some(x=>x.start==='2026-11-12T09:00:00.000Z'));assert.ok(s.some(x=>x.start==='2026-11-12T08:00:00.000Z'));
  assert.ok(!s.some(x=>x.date==='2026-11-13'),'blocked day');
  assert.equal(r.isBookable('2026-11-12T10:00:00Z',now,busy),true);
  assert.equal(r.isBookable('2026-11-12T09:00:00Z',now,busy),false,'taken');
  assert.equal(r.isBookable('2026-11-12T09:30:00Z',now,busy),false,'not on the hour');
  assert.equal(r.isBookable('2026-11-14T09:00:00Z',now,busy),false,'Saturday');
});

test('input check: required fields, email, phone and topic',async()=>{
  const {validate}=await load();
  const ok={topic:'workflow',start:'2026-11-25T08:00:00Z',name:'An Peeters',email:'An@Voorbeeld.be ',phone:'+32 470 12 34 56',organisation:'Voorbeeld nv',job_title:'Zaakvoerder',lang:'fr'};
  const v=validate(ok);assert.equal(v.ok,true);assert.equal(v.value.email,'an@voorbeeld.be');assert.equal(v.value.lang,'fr');
  assert.equal(validate({...ok,lang:'de'}).value.lang,'nl');
  for(const [field,bad] of [['topic',{topic:'iets'}],['email',{email:'an@'}],['phone',{phone:'abc'}],['name',{name:'A'}],['organisation',{organisation:' '}],['job_title',{job_title:''}],['start',{start:'morgen'}],['note',{note:'x'.repeat(2001)}]])
    assert.deepEqual(validate({...ok,...bad}),{ok:false,field},field);
});

test('calendar invitation is valid for Outlook and other calendars',async()=>{
  const {invitation,when}=await load();
  const ics=invitation({id:'abc',start_at:'2026-11-25T08:00:00.000Z',topic:'training',lang:'nl',full_name:'An Peeters, Voorbeeld',email:'an@voorbeeld.be'},'info@grow-faster.be','erlend@grow-faster.be');
  const flat=ics.replace(/\r\n /g,'');
  assert.match(ics,/^BEGIN:VCALENDAR\r\n/);assert.match(ics,/METHOD:REQUEST\r\n/);assert.match(ics,/DTSTART:20261125T080000Z\r\n/);assert.match(ics,/DTEND:20261125T090000Z\r\n/);
  assert.match(ics,/UID:abc@grow-faster\.be/);assert.match(ics,/SUMMARY:Gesprek Grow Faster: Training/);assert.match(ics,/CN=An Peeters\\, Voorbeeld/);
  assert.match(flat,/ORGANIZER;CN=Grow Faster:mailto:info@grow-faster\.be/);assert.match(flat,/PARTSTAT=ACCEPTED:mailto:erlend@grow-faster\.be/);assert.match(flat,/mailto:an@voorbeeld\.be/);
  for(const line of ics.split('\r\n'))assert.ok(line.length<=75,line);
  assert.deepEqual(when('2026-11-25T08:00:00.000Z','nl'),{date:'woensdag 25 november 2026',time:'09:00 - 10:00'});
  assert.equal(when('2026-11-25T08:00:00.000Z','fr').date,'mercredi 25 novembre 2026');
});
