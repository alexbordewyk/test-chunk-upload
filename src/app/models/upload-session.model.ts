export class UploadSession {
  sessionID: string;
  chunksProcessed: number;
  currentChunk: number = 0;
  chunkSize: number;
  abortSessionEndpoint: string;
  commitSessionEndpoint: string;
  listPartsEndpoint: string;
  logEventEndpoint: string;
  statusEndpoint: string;
  uploadEndpoint: string;
  sessionExpiresAt: string;
  totalParts: number;


  constructor(data: any) {
    this.sessionID = data.id;
    this.chunksProcessed = data.num_parts_processed;
    this.chunkSize = data.part_size;
    this.abortSessionEndpoint = data.session_endpoints.abort;
    this.commitSessionEndpoint = data.session_endpoints.commit;
    this.listPartsEndpoint = data.session_endpoints.list_parts;
    this.logEventEndpoint = data.session_endpoints.log_event;
    this.statusEndpoint = data.session_endpoints.status;
    this.uploadEndpoint = data.session_endpoints.upload_part;
    this.sessionExpiresAt = data.session_expires_at;
    this.totalParts = data.total_parts;
  }
}
