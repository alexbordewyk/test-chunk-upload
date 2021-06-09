import { Component } from '@angular/core';
import {map, switchMap, take} from "rxjs/operators";
import {UploadService} from "./upload.service";
import {UploadSession} from "./models/upload-session.model";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  fileName: string = '';
  fileProgress: number = 0;

  constructor(private uploadService: UploadService) { }

  onFileSelected(event: any) {

    const file: File = event.target.files[0];

    if (file) {
      this.fileName = file.name;

      this.uploadService.createBoxUploadSession(file.name, file.size)
        .pipe(
          map(uploadSession => {
            return {
              uploadSession: uploadSession,
              resumable: this.uploadService.createResumableSession(uploadSession)
            };
          }),
          take(1)
        ).subscribe((session: any) => {
          this.uploadFile(session.resumable, file, session.uploadSession);
        });
    }
  }

  private uploadFile(resumable: resumablejs.Resumable, file: File, uploadSession: UploadSession) {
    resumable.on('fileProgress', resumableFile => {
      this.fileProgress = resumableFile.progress(false);
    });
    resumable.on('fileSuccess', resumableFile => {
      this.uploadService.commitBoxUploadSession(resumableFile, uploadSession);
    });
    resumable.on('fileAdded', addedFile => {
      resumable.upload();
    });
    resumable.addFile(file);
  }
}
