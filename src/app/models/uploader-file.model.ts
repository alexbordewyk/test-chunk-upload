import {UploadSession} from "./upload-session.model";

export interface UploaderFile {
  uploadSession: UploadSession,
  resumable: resumablejs.Resumable
}
