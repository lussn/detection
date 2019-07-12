import React from "react"
import ReactDOM from "react-dom"
import * as cocoSsd from "@tensorflow-models/coco-ssd"
import "@tensorflow/tfjs"
import { isMobile } from 'react-device-detect'
import "./styles.css"

const questions = [
  {
    message: 'Welcome to the challenge. The first goal is to find a dog (and also cuddle him)',
    label: 'dog'
  },
  {
    message: 'Done, nice dog. Once you have the dog, you should look for a Windows 98 book, pure wisdom!',
    label: 'book'
  },
  {
    message: 'Challenge finished! You will get some chocolate',
    label: 'end'
  }
]

class App extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();

  constructor() {
    super()
    this.state = { question: 0 };
  }

  componentDidMount() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const facingMode = isMobile ? { exact: 'environment' } : 'user'
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: facingMode
          }
        })
        .then(stream => {
          window.stream = stream;
          this.videoRef.current.srcObject = stream;
          return new Promise((resolve, reject) => {
            this.videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          });
        });
      const modelPromise = cocoSsd.load();
      Promise.all([modelPromise, webCamPromise])
        .then(values => {
          this.detectFrame(this.videoRef.current, values[0]);
        })
        .catch(error => {
          console.error(error);
        });
    }
  }

  detectFrame = (video, model) => {
    model.detect(video).then(predictions => {
      this.renderPredictions(predictions);
      requestAnimationFrame(() => {
        this.detectFrame(video, model);
      });
    });
  };

  renderPredictions = predictions => {
    const ctx = this.canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";
    predictions.forEach(prediction => {
      if (questions[this.state.question].label === prediction.class) {
        this.setState({question: this.state.question + 1})
      }
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      const width = prediction.bbox[2];
      const height = prediction.bbox[3];
      // Draw the bounding box.
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);
      // Draw the label background.
      ctx.fillStyle = "#00FFFF";
      const textWidth = ctx.measureText(prediction.class).width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
    });

    /*predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      // Draw the text last to ensure it's on top.
      ctx.fillStyle = "#000000";
      ctx.fillText(prediction.class, x, y);
    });*/
  };

  render() {
   return (
      <div>
        <div className={isMobile ? 'wrapper-mobile' : 'wrapper-desktop'}>
          <video
            className="size"
            autoPlay
            playsInline
            muted
            ref={this.videoRef}
            width="400"
            height="400"
          />
          <canvas
            className="size"
            ref={this.canvasRef}
            width="400"
            height="400"
          />
        </div>
        <Message question={this.state.question} />
      </div>
    );
  }
}

class Message extends React.Component {
  render() {
    return <div className={isMobile ? 'message-mobile' : 'message-desktop'}>
      {questions[this.props.question].message}
    </div>
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
