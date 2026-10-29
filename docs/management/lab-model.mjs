export function targetSpeed(config,craft,progression,mode){
  var score=Math.min(craft.speedCapScore,Math.max(0,Math.trunc(Number(progression)||0)));
  var base=config.BASE_SCROLL_SPEED*craft.scrollSpeedMultiplier+config.SPEED_STEP_INCREMENT*Math.floor(score/config.SPEED_STEP_SCORE_POINTS);
  return base*(mode==='slow'?config.BOSS_SLOW_MULTIPLIER:mode==='fast'?config.BOSS_FAST_MULTIPLIER*(craft.id==='velocity'?config.VELOCITY_FAST_BOSS_SPEED_MULTIPLIER:1):1);
}
export function specialEligibility(config,input){
  var p=input.playerX,w=input.wallX,s=input.speed,t=input.windowSeconds,h=input.hitbox,success=input.successWidth;
  if(![p,w,s,t,h,success].every(Number.isFinite)||s<=0||t<0||h<=0||success<=0)return false;
  return p+h/2<=w&&p+success/2>=w-s*t&&p-success/2<=w;
}
export function timingSpan(input){
  var early=input.speed*input.windowSeconds+input.successWidth/2,late=input.hitbox/2;
  var width=Math.max(0,early-late);
  return {earlyOffset:early,lateOffset:late,width:width,seconds:input.speed>0?width/input.speed:0};
}
export function hybridGapSafe(input){return input.playerY-input.hitbox/2>=input.gapCenter-input.gapHeight/2&&input.playerY+input.hitbox/2<=input.gapCenter+input.gapHeight/2;}
export function simulateFlight(input){
  var step=Number(input.step)||1/60,duration=Math.max(0,Math.min(8,Number(input.duration)||3));
  var gravity=Math.max(0,Number(input.gravity)||0),lift=Math.max(0,Number(input.lift)||0),interval=Math.max(step,Number(input.interval)||.4);
  var y=270,v=-lift,next=interval,points=[{time:0,y:270,velocity:-lift}];
  for(var i=1;i<=Math.ceil(duration/step);i++){
    var time=i*step;if(time-step+1e-9>=next){v=-lift;next+=interval;}
    v+=gravity*step;y+=v*step;points.push({time:time,y:y,velocity:v});
  }
  return points;
}
