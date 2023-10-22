import React, { useState, useEffect, useRef } from 'react';
import Popup from "./Popup";
import { getElementError } from '@testing-library/react';
import Flower from "./flower-image.png"
//Dont need: FileName, FileURL until we can get the image URL, will need AudioURL once we get that working
function App() {

  const [popupVisible, setPopupVisible] = useState(false);
  const [nameData, setNameData] = useState([]);
  const [defaultEndDate, setDefaultEndDate] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileURL, setSelectedFileURL] = useState('');
  const [indexVal, setIndexVal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
      const enteredName = event.target.name.value.trim();
      const startDate = event.target.startDate.value.trim();
      const endDate = event.target.endDate.value.trim();
      if (enteredName === '' || startDate === '' || selectedFileName === '') {
        alert('Please fill out this field.');
        return;
      }
      else {
      document.getElementById("submit").style.display = "none";
      document.getElementById("submit-wait").style.display = "block";
      }
      setLoading(true);
      
      const dataObj = new FormData();
      dataObj.append('file', selectedFile);
      dataObj.append('name', enteredName);
      dataObj.append('born', startDate);
      dataObj.append('died', endDate);
      dataObj.append('id', indexVal);
      console.log(dataObj)
  
      const res = await fetch("https://taub6qjl6e7nyloadn3qjk5o4e0skgfg.lambda-url.ca-central-1.on.aws/", {
        method: "POST",
        headers: {
          "Context-Type": "application/json"
        },
        body: dataObj
      });
      setLoading(false);
      const obiList = await res.json();
      var newNameObj = {id: obiList.id, name: obiList.name, born: obiList.born, died: obiList.died, image_url: obiList.image_url, obituary: obiList.obituary, showObituaryText: true, voice_url: obiList.voice_url};
      setNameData([...nameData, newNameObj]);
      localStorage.setItem('nameData', JSON.stringify([...nameData, newNameObj]));
      resetEverything(event);
  };

  const handleExit = (event) => {
    event.preventDefault();
    setPopupVisible(false);
    setSelectedFileName('');
    setSelectedFile(null);
    setSelectedFileURL('');
    inputRefSubmit.current.reset();
    setDefaultEndDate(null);
  };

  const handleClick = () => {
    setPopupVisible(!popupVisible);
    setSelectedFileName('');
    setSelectedFile(null);
    setSelectedFileURL('');
  };

  const handleClearNames = () => {
    setNameData([]);
    localStorage.removeItem('nameData');
    setIndexVal(0);
  };

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const formatDate = (when) => {
    const formatted = new Date(when).toLocaleString("en-US", options);
    if (formatted === "Invalid Date") {
        return "";
    }
    return formatted;
  };

  const getCurrentTime = () => {
    var now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    now.setMilliseconds(null);
    setDefaultEndDate(now.toISOString().slice(0, -1));
  }

  const endDateChangeHandler = (event) => {
    setDefaultEndDate(event.target.value);
  }

  const handleFileChange = (event) => {
    setSelectedFileName(event.target.files[0].name);
    setSelectedFile(event.target.files[0]);
    setSelectedFileURL(URL.createObjectURL(event.target.files[0]));
    event.target.value = '';
  };

  const printNameObject = () => {
    console.log(nameData);
  };

  const resetEverything = (event) => {
    document.getElementById("submit").style.display = "block";
    document.getElementById("submit-wait").style.display = "none";
    setPopupVisible(false);
    setSelectedFileName('');
    event.target.name.value = '';
    event.target.startDate.value = '';
    event.target.endDate.value = '';
  }

  useEffect(() => {
    setIndexVal(nameData.length);
  }, [nameData])

  useEffect(() => {
    nameData.forEach((ObiObj) => {
      ObiObj.showObituaryText = false;
    })
  }, [])

  useEffect(() => {
    const getObi = async () => {
      const response = await fetch(
        "https://zzd2atgyer3rhe3eam3h2fiy4i0iwimp.lambda-url.ca-central-1.on.aws/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const obiList = await response.json();
      setNameData(obiList);
      console.log(obiList);
    };
    getObi();
  }, []);
  // useEffect(() => {
  //   const abortController = new AbortController();
  
  //   async function getObi() {
  //     try {
  //       const res = await fetch(`https://b3fhrkjnf3rkqhhz7uic4z3nka0owcqs.lambda-url.ca-central-1.on.aws/`, { signal: abortController.signal });
  //       const ObiList = await res.json();
  //       setNameData(ObiList);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }
  
  //   getObi();
  
  //   return () => {
  //     abortController.abort();
  //   };
  // }, []);

  const toggleObiText = (nameObj) => {
    const updatedNameData = [...nameData];
    const index = updatedNameData.findIndex(obj => obj.id === nameObj.id);
    updatedNameData[index] = { ...nameObj, showObituaryText: !nameObj.showObituaryText };
    setNameData(updatedNameData);
  }


  
  const playAudio = (audio) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setCurrentAudio(audio);
    audio.play();
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
  };
  
  const inputRef = useRef(null);

  const inputRefSubmit = useRef(null);

  return (
    <>
      <header id="mainheader">
        <h1 id="maintitle">The Last Show</h1>
        <button id="newobi" onClick= {() => {handleClick(); getCurrentTime();}}>+ New Obituary</button>
        <Popup visible={popupVisible}>
          <form onSubmit={handleSubmit} ref={inputRefSubmit}>
            <div className = "input-container">
              <h1 id="create-new-obi">Create new Obituary</h1>
              <br/>
              <div id="image-contain">
                <img src = {Flower} alt = "Image placeholder" id="form-image"/>
              </div>
              <br/>
              <div className = "input-image">
                <button type="button" onClick={() => inputRef.current.click()} className = "input-file">{<p>Select an Image for the Deceased {selectedFileName && <mark id="selected-file-name">({selectedFileName})</mark>}</p>}</button>
                <input type="file" ref={inputRef} id="image" accept="image/*" style={{display: 'none'}} onChange={handleFileChange} />
              </div>
              <br/>
              <input type="text" id="name" name="name" placeholder="Name of the Deceased" className = "input-box"/>
              <br/>
              <div id = "selecting-dates">
                <i>Born:</i>
                <input id = "startDate" type = "datetime-local" step = "1" className = "note-date"></input>
                &emsp;&emsp;<i>Died:</i>
                <input id = "endDate" type = "datetime-local" onChange = {endDateChangeHandler} value={defaultEndDate} step = "1" className = "note-date"></input>
              </div>
              <br/>
              <button type="submit" className="submit-button" id="submit">Write Obituary</button>
              <button className="submit-button-waiting" id="submit-wait" disabled>Please wait. It's not like they're gonna be late or something...</button>
              <button className="exit-button" type="button" onClick={handleExit}>X</button>
            </div>
          </form>
        </Popup>
      </header>
      <div>
        {nameData.length > 0 ? (
          <div className="names-container">
            {nameData.map((nameObj, index) => (
              <div className="name-container" key={index}>
                <button className = "name">
                <img key={index} src={nameObj.image_url} alt="uploaded" className="uploaded-image" onClick={() => toggleObiText(nameObj)}/>
                <p className="welcome">{`${nameObj.name}`}</p>
                <p className="dates">{`${formatDate(nameObj.born)} - ${formatDate(nameObj.died)}`}</p>
                {nameObj.showObituaryText && (
                  <br/>
                )}
                {nameObj.showObituaryText && (
                  <p className="obi-text">{nameObj.obituary}</p>
                )}
                {nameObj.showObituaryText && (
                  <button id={"btn-" + nameObj.id} className="play-pause-button">&#9654;</button>
                )}
                </button>
              </div>
            ))}
          </div>
          ) : (
          <h6 id="none">No Obituaries Yet</h6>
          )}
        <button onClick={handleClearNames}>Clear Names</button>
        <button onClick={printNameObject}>Console Names</button>
      </div>
    </>
  );
  
}

export default App;