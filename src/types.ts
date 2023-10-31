import {TranscribeStreamingClient} from "@aws-sdk/client-transcribe-streaming";
import {ICredentials} from "@aws-amplify/core";

export interface Transcript {
  channel: string,
  partial?: boolean,
  text?: string
}

export interface LiveTranscriptionProps {
  currentCredentials: ICredentials,
  mediaRecorder: AudioWorkletNode | undefined,
  setMediaRecorder: (m: AudioWorkletNode) => void,
  setTranscriptionClient: (a: TranscribeStreamingClient) => void,
  transcriptionClient: TranscribeStreamingClient | null,
  transcribeStatus: boolean,
  setTranscript: (t: Transcript) => void,
}


export type RecordingProperties = {
  numberOfChannels: number,
  sampleRate: number,
  maxFrameCount: number
};

export type MessageDataType = {
  message: string,
  buffer: Array<Float32Array>,
  // buffer: ArrayBuffer,
  recordingLength: number
};