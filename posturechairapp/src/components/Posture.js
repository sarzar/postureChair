import React, { useState } from "react";
import Webcam from 'react-webcam'
import Button from '@material-ui/core/Button'; 
import Alert from '@material-ui/lab/Alert';
import { light } from "@material-ui/core/styles/createPalette";
import Grow from '@material-ui/core/Grow';
import './Posture.css';

var apiurl= 'https://posture-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/432931e0-a0b1-4162-9986-aaaa27dcd8e4/classify/iterations/Final%20model/image'

const videoConstraints = {
    width: 720,
    height: 480,
    aspectRatio: 1.5,
};

async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit

    //Utilized Custom Vision AI API to integrate machine learning
    headers: {
      'Content-Type': 'application/octet-stream',
     "Prediction-Key":'931ce4aeeefa4a2e9efc9a9db63ac14a'
     
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: data
  });
  return response.json(); // parses JSON response into native JavaScript objects
}


function Posture() {
    const webcamRef = React.useRef(null);
    const imgRef = React.useRef(null);
    const [imgSrc, setImgSrc] = React.useState(null);
    const [timerRef, setTimerRef] = React.useState(null);

    const [posture, setPosture] = useState({
      Session: "stop",
      PostureState: "good",
      Err_msg: "Neck Tilt",
      HeadTilt: 0,
      Hunching: 0,
      Reclined: 0,
      ArmRest: 0
  })
  

  /////////////////////////////////////////////////////////////////////////////////////  Functions /////////////////////////////////////////////////////////////////
  const capture = React.useCallback(() => {
    if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
    }
}, [webcamRef, setImgSrc]);

function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
    u8arr[n] = bstr.charCodeAt(n);
    }
  return new File([u8arr], filename, {type:mime});
  }

  function changeSession() {
    setPosture(prevPosture => {
      if (timerRef===null){
       let timer =  setInterval(function() {

        capture();
       }, 7000); //should be 1 minute for final product, no user settings
       setTimerRef(timer)
      }
      else{
         clearInterval(timerRef);
         setTimerRef(null);
      }
        return {
            Session: (posture.Session == "Start") ? "Stop" : "Start",
            PostureState: prevPosture.PostureState,
            Err_msg: prevPosture.Err_msg,
            HeadTilt: prevPosture.HeadTilt,
            Hunching: prevPosture.Hunching,
            Reclined: prevPosture.Reclined,
            ArmRest: prevPosture.ArmRest
        };
    });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

React.useEffect(() => {
      if (imgRef.current ) { 
var fileData = dataURLtoFile(imgSrc, "imageName.jpg");

postData(apiurl, fileData)
.then(data => {
console.log(data.predictions[0].tagName); // JSON data parsed by `data.json()` call
if (posture.PostureState=="good" && data.predictions[0].tagName!="Good"){
  switch(data.predictions[0].tagName) {
    case "Head Tilt":
      localStorage.setItem('Headtilt', posture.HeadTilt + 1 );
      break;
    case "Hunching":
      localStorage.setItem('Hunching', posture.Hunching + 1 );
      break;
      case "Reclining Back":
        localStorage.setItem('Reclined', posture.Reclined + 1 );
      break;
      case "Resting Head on Hand":
        localStorage.setItem('Armrest', posture.ArmRest + 1 );
      break;
    default:
      
  } 
 
  setPosture(prevPosture => {
          return {
            Session: prevPosture.Session,
            PostureState: "bad", //change to bad state
            Err_msg: data.predictions[0].tagName, //state the issue
            HeadTilt:(data.predictions[0].tagName=="Head Tilt") ? prevPosture.HeadTilt + 1: prevPosture.HeadTilt,
            Hunching:(data.predictions[0].tagName=="Hunching") ? prevPosture.Hunching + 1: prevPosture.Hunching,
            Reclined:(data.predictions[0].tagName=="Reclining Back") ? prevPosture.Reclined + 1: prevPosture.Reclined,
            ArmRest:(data.predictions[0].tagName=="Resting Head on Hand") ? prevPosture.ArmRest + 1: prevPosture.ArmRest
          };
           });
           
  
  var msg = new SpeechSynthesisUtterance();
  msg.text = "Please fix your posture";
  window.speechSynthesis.speak(msg);



  setTimeout(()=>{
    capture()
  }, 2000);
}
else if (posture.PostureState=="bad" && data.predictions[0].tagName=="Good"){

  setPosture(prevPosture => {
          return {
                Session: prevPosture.Session,
                PostureState: "good",
                Err_msg:prevPosture.Err_msg,
                HeadTilt:prevPosture.HeadTilt,
                Hunching: prevPosture.Hunching,
                Reclined: prevPosture.Reclined,
                ArmRest: prevPosture.ArmRest
              };
               });
}

});     

}
}, [imgSrc])


    return (
    <div className = "webcam-div">
        <Grow in = {posture.PostureState === "bad"} >
        <Alert variant = "filled"
        severity = "error"
        className = "alert"> 
        { "Warning! Bad posture detected. Please fix immediately :)" } 
        </Alert> 
        </Grow>
        <Webcam videoConstraints = {videoConstraints}
        audio = {false}
        ref = {webcamRef}
        screenshotFormat = "image/jpeg"/>
        <div />
        <Button variant = "contained"
        color = "primary"
        onClick = { changeSession } > {
            (posture.Session == "Start") ? "Stop" : "Start"
        } </Button>
        <div />
    
        {
            imgSrc &&
            <img id="image" className="detect" ref={imgRef} src={imgSrc} />
        }
        </div >
    )

}
export default Posture;