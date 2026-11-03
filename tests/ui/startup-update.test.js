import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {renderStartupUpdateDialog} from '../../src/ui/startup-update.js';
import updates from '../../docs/player/updates.json';

describe('startup guide updates',()=>{
 it('uses latest guide data, safe text, semantic dialog and existing full guide link',()=>{
  const entry=updates.entries[0],view=renderStartupUpdateDialog(entry,{close:vi.fn()});
  expect(view.querySelector('#startup-update-title').textContent).toBe(entry.version);
  expect([...view.querySelectorAll('li')].map(e=>e.textContent)).toEqual(entry.body);
  expect(view.querySelector('.update-date').textContent).toBe(entry.date.replaceAll('-','.'));
  expect(view.querySelector('[role=dialog]').getAttribute('aria-modal')).toBe('true');
  const link=view.querySelector('a');expect(link.getAttribute('href')).toBe('/guide/index.html#updates');expect(link.rel).toBe('noopener');
  const future=renderStartupUpdateDialog({...entry,version:'v0.21',body:['<img src=x onerror=alert(1)>']});
  expect(future.querySelector('img')).toBeNull();expect(future.querySelector('li').textContent).toBe('<img src=x onerror=alert(1)>');
  expect(readFileSync('src/main.js','utf8')).toContain('startupUpdateEntry: playerUpdates.entries[0] ?? null');
 });
 it('fails open for missing or malformed content rather than blocking startup',()=>{
  for(const entry of[null,{}, {...updates.entries[0],body:[]},{...updates.entries[0],date:null},{...updates.entries[0],body:[null]}])expect(renderStartupUpdateDialog(entry)).toBeNull();
 });
 it('traps focus, consumes menu keys and supports non-repeated confirm and Escape',()=>{
  const close=vi.fn(),view=renderStartupUpdateDialog(updates.entries[0],{close});document.body.append(view);
  try{
   const guide=view.querySelector('a'),confirm=view.querySelector('button');confirm.focus();
   const tab=new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});confirm.dispatchEvent(tab);expect(tab.defaultPrevented).toBe(true);expect(document.activeElement).toBe(guide);
   guide.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));expect(document.activeElement).toBe(confirm);
   confirm.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true}));expect(document.activeElement).toBe(guide);
   confirm.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',repeat:true,bubbles:true,cancelable:true}));expect(close).not.toHaveBeenCalled();
   for(const key of['Enter',' ','Escape'])confirm.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));expect(close).toHaveBeenCalledTimes(3);
  }finally{view.remove();}
 });
});
