import ResumableFile = ResumableModule.ResumableFile;
import ResumableChunk = ResumableModule.ResumableChunk;

export interface ResumableOptions {
  target: string;
  chunkSize: number;
  simultaneousUploads:4;
  testChunks:false;
  throttleProgressCallbacks:1;
  forceChunkSize: true;
  chunkNumberParameterName: null;
  totalChunksParameterName: null;
  chunkSizeParameterName: null;
  totalSizeParameterName: null;
  identifierParameterName: null;
  fileNameParameterName: null;
  relativePathParameterName: null;
  currentChunkSizeParameterName: null;
  setChunkTypeFromFile: false;
  typeParameterName: null;
  /*headers: (file: ResumableFile, chunk: ResumableChunk) => {
    return {
      "Digest": `sha=${chunk.hash}`,
      "Content-Range": `bytes ${chunk.startByte}-${chunk.endByte}/${chunk.fileObjSize}`,
      "Content-Type": 'application/octet-stream'
    };
  };*/
}
