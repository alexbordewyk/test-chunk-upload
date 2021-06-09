export class DefaultResumableOptions {
  simultaneousUploads = 1;
  testChunks = false;
  forceChunkSize = true;
  chunkNumberParameterName = null;
  totalChunksParameterName = null;
  chunkSizeParameterName = null;
  totalSizeParameterName = null;
  identifierParameterName = null;
  maxFiles = 1;
  fileNameParameterName = null;
  relativePathParameterName = null;
  currentChunkSizeParameterName = null;
  setChunkTypeFromFile = false;
  typeParameterName = null;
  maxChunkRetries = 0;
  uploadMethod = 'PUT';
  method = 'octet';
}
