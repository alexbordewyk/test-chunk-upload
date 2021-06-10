import {Component, Input} from '@angular/core';
import {UploaderFile} from "../../models/uploader-file.model";

@Component({
  selector: 'app-uploader-file',
  templateUrl: './uploader-file.component.html',
  styleUrls: ['./uploader-file.component.css']
})
export class UploaderFileComponent {
  // @ts-ignore
  @Input() uploaderFile: UploaderFile;
}
