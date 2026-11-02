var audioToPlay=document.getElementById('audioFile');
window.onload=function(){
  window.literalResult={attempted:true,status:'pending'};
  audioToPlay.play().then(function(){
    window.literalResult.status='playing';document.getElementById('result').textContent='Playing';
  }).catch(function(error){
    window.literalResult.status=error.name;document.getElementById('result').textContent=error.name;
  });
};
