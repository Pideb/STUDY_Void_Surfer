import {synthesizeBossEntrySiren} from './boss-entry-synth.js';
export function createBossEntryBuffer(context){
  const sound=synthesizeBossEntrySiren(context.sampleRate);
  const buffer=context.createBuffer(2,sound.channels[0].length,sound.sampleRate);
  for(let channel=0;channel<2;channel++)buffer.getChannelData(channel).set(sound.channels[channel]);
  return buffer;
}
