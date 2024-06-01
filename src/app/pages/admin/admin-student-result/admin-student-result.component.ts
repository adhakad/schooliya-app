import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Subject } from 'rxjs';
import { read, utils, writeFile } from 'xlsx';
import { ExamResultService } from 'src/app/services/exam-result.service';
import { MatRadioChange } from '@angular/material/radio';
import { AdminAuthService } from 'src/app/services/auth/admin-auth.service';
import { ExamResultStructureService } from 'src/app/services/exam-result-structure.service';

@Component({
  selector: 'app-admin-student-result',
  templateUrl: './admin-student-result.component.html',
  styleUrls: ['./admin-student-result.component.css']
})
export class AdminStudentResultComponent implements OnInit {
  examResultForm: FormGroup;
  showModal: boolean = false;
  showBulkImportModal: boolean = false;
  updateMode: boolean = false;
  deleteMode: boolean = false;
  deleteById: String = '';
  successMsg: String = '';
  errorMsg: String = '';
  errorCheck: Boolean = false;
  resultStructureInfo: any;
  allExamResults: any[] = [];
  examResultInfo: any[] = [];
  studentInfo: any;
  recordLimit: number = 10;
  filters: any = {};
  number: number = 0;
  paginationValues: Subject<any> = new Subject();
  page: Number = 0;
  cls: any;
  selectedValue: number = 0;
  classSubject: any[] = [];
  practicalSubjects: any[] = [];
  fileChoose: boolean = false;
  existRollnumber: number[] = [];
  bulkResult: any[] = [];
  selectedExam: any = '';
  stream: string = '';
  notApplicable: String = "stream";
  examType: any[] = ["quarterly", "half yearly", "final"];
  streamMainSubject: any[] = ['Mathematics(Science)', 'Biology(Science)', 'History(Arts)', 'Sociology(Arts)', 'Political Science(Arts)', 'Accountancy(Commerce)', 'Economics(Commerce)', 'Agriculture', 'Home Science'];
  loader: Boolean = true;
  adminId!: string;
  constructor(private fb: FormBuilder, public activatedRoute: ActivatedRoute, private adminAuthService: AdminAuthService, private examResultService: ExamResultService, private examResultStructureService: ExamResultStructureService) {
    this.examResultForm = this.fb.group({
      adminId: [''],
      rollNumber: ['324567300', Validators.required],
      examType: [''],
      stream: [''],
      createdBy: [''],
      resultDetail:[''],
      type: this.fb.group({
        theoryMarks: this.fb.array([]),
        practicalMarks: this.fb.array([]),
      }),
    });
  }


  ngOnInit(): void {
    let getAdmin = this.adminAuthService.getLoggedInAdminInfo();
    this.adminId = getAdmin?.id;
    this.cls = this.activatedRoute.snapshot.paramMap.get('id');
    this.getStudentExamResultByClass(this.cls);
  }


  addExamResultModel() {
    this.showModal = true;
    this.deleteMode = false;
    this.updateMode = false;
    this.examResultForm.reset();

  }
  addBulkExamResultModel() {
    this.showBulkImportModal = true;
    this.errorCheck = false;
  }
  updateExamResultModel(examResult: any) {
    this.showModal = true;
    this.deleteMode = false;
    this.updateMode = true;
    this.examResultForm.patchValue(examResult);
  }
  deleteExamResultModel(id: String) {
    this.showModal = true;
    this.updateMode = false;
    this.deleteMode = true;
    this.deleteById = id;
  }

  falseFormValue() {
    const controlOne = <FormArray>this.examResultForm.get('type.theoryMarks');
    const controlTwo = <FormArray>this.examResultForm.get('type.practicalMarks');
    controlOne.clear();
    controlTwo.clear();
    this.examResultForm.reset();
  }
  falseAllValue() {
    this.falseFormValue();
    this.practicalSubjects = [];
    this.classSubject = [];
  }

  closeModal() {
    this.falseAllValue();
    this.updateMode = false;
    this.deleteMode = false;
    this.errorMsg = '';
    this.selectedExam = '';
    this.stream = '';
    this.examResultForm.reset();
    this.showModal = false;
    this.showBulkImportModal = false;
  }
  onChange(event: MatRadioChange) {
    this.selectedValue = event.value;
  }

  successDone() {
    setTimeout(() => {
      this.closeModal();
      this.successMsg = '';
      this.getStudentExamResultByClass(this.cls);
    }, 1000)
  }

  getStudentExamResultByClass(cls: any) {
    let params = {
      class: cls,
      adminId: this.adminId,
    }
    this.examResultService.getAllStudentExamResultByClass(params).subscribe((res: any) => {
      if (res) {
        this.examResultInfo = res.examResultInfo;
        this.studentInfo = res.studentInfo;
        const studentInfoMap = new Map();
        this.studentInfo.forEach((item: any) => {
          studentInfoMap.set(item._id, item);
        });

        const combinedData = this.examResultInfo.reduce((result: any, examResult: any) => {
          const studentInfo = studentInfoMap.get(examResult.studentId);

          if (studentInfo) {
            result.push({
              studentId: examResult.studentId,
              class: examResult.class,
              examType: examResult.examType,
              stream: examResult.stream,
              createdBy: examResult.createdBy,
              status: examResult.status || "",
              name: studentInfo.name,
              rollNumber: studentInfo.rollNumber,
              admissionNo: studentInfo.admissionNo
            });
          }

          return result;
        }, []);
        if (combinedData) {
          this.allExamResults = combinedData;
          setTimeout(() => {
            this.loader = false;
          }, 1000);
        }
      }
    })
  }


  selectExam(selectedExam: string) {
    if (this.classSubject || this.practicalSubjects) {
      this.falseAllValue();
    }
    this.selectedExam = selectedExam;
    if (this.stream && selectedExam && this.cls) {
      let params = {
        adminId: this.adminId,
        cls: this.cls,
        stream: this.stream,
        examType: selectedExam,
      }
      this.getSingleClassResultStrucByStream(params);
    }
  }

  chooseStream(stream: any) {
    if (this.classSubject || this.practicalSubjects) {
      this.falseAllValue();
    }
    this.stream = stream;
    if (stream && this.selectedExam && this.cls) {
      let params = {
        adminId: this.adminId,
        cls: this.cls,
        stream: stream,
        examType: this.selectedExam,
      }
      this.getSingleClassResultStrucByStream(params);
    }
  }

  getSingleClassResultStrucByStream(params: any) {
    this.examResultStructureService.getSingleClassResultStrucByStream(params).subscribe((res: any) => {
      if (res) {
        this.resultStructureInfo = res;
        this.practicalSubjects = [];
        this.classSubject = [];
        if (res.theoryMaxMarks) {
          this.classSubject = res.theoryMaxMarks.map((item: any) => {
            const theorySubject = Object.keys(item)[0];
            return theorySubject;
          })
          if (this.classSubject) {
            this.patchTheory();
          }
        }

        if (res.practicalMaxMarks) {
          this.practicalSubjects = res.practicalMaxMarks.map((item: any) => {
            const practicalSubject = Object.keys(item)[0];
            return practicalSubject;
          })
          if (this.practicalSubjects) {
            this.patchPractical();
          }
        }
      }
    }, err => {
      this.falseAllValue();
    })
  }

  patchTheory() {
    const controlOne = <FormArray>this.examResultForm.get('type.theoryMarks');
    this.classSubject.forEach((x: any) => {
      controlOne.push(this.patchTheoryValues(x));
      this.examResultForm.reset();
    })
  }
  patchPractical() {
    const controlOne = <FormArray>this.examResultForm.get('type.practicalMarks');
    this.practicalSubjects.forEach((x: any) => {
      controlOne.push(this.patchPracticalValues(x))
      this.examResultForm.reset();
    })
  }
  patchTheoryValues(theoryMarks: any) {
    return this.fb.group({
      [theoryMarks]: [theoryMarks],
    })
  }

  patchPracticalValues(practicalMarks: any) {
    return this.fb.group({
      [practicalMarks]: [practicalMarks],
    })
  }

  examResultAddUpdate() {
    const examResult = this.examResultForm.value.type;
    const countSubjectsBelowPassingMarks = (passMarks: any[], actualMarks: any[]): number => {
      return passMarks.reduce((count, passMarkSubject, index) => {
        const subject = Object.keys(passMarkSubject)[0];
        const passMark = parseInt(passMarkSubject[subject], 10);
        const actualMark = actualMarks[index] ? parseInt(actualMarks[index][subject], 10) : 0;
        return actualMark < passMark ? count + 1 : count;
      }, 0);
    };
    const count = countSubjectsBelowPassingMarks(this.resultStructureInfo.theoryPassMarks, examResult.theoryMarks);
    const resultStatus = count === 0 ? 'PASS' : count <= 2 ? 'SUPPLY' : 'FAIL';
    const calculateMaxMarks = (marksArray: any[]): number => {
      console.log(marksArray)
      return marksArray.reduce((total, subjectMarks) => {
        const subjectName = Object.keys(subjectMarks)[0];
        return total + parseFloat(subjectMarks[subjectName]);
      }, 0);
    };
    const totalTheoryMaxMarks = calculateMaxMarks(this.resultStructureInfo.theoryMaxMarks);
    const totalPracticalMaxMarks = this.resultStructureInfo.practicalMaxMarks ? calculateMaxMarks(this.resultStructureInfo.practicalMaxMarks) : 0;
    const totalMaxMarks = totalTheoryMaxMarks + totalPracticalMaxMarks;
    const calculateGrades = (subjectMarks: any[], isPractical: boolean) => {
      return subjectMarks.map((subjectMark) => {
        const subjectName = Object.keys(subjectMark)[0];
        const theoryMarks = parseFloat(subjectMark[subjectName]);
        const practicalMarkObject = isPractical ? examResult.practicalMarks.find((practicalMark: any) => practicalMark && practicalMark.hasOwnProperty(subjectName)) : null;
        const practicalMarks = practicalMarkObject ? parseFloat(practicalMarkObject[subjectName]) : 0;
        const totalMarks = theoryMarks + practicalMarks;
        const theoryMaxMarksObject = this.resultStructureInfo.theoryMaxMarks.find((theoryMaxMarks: any) => theoryMaxMarks && theoryMaxMarks.hasOwnProperty(subjectName));
        const theoryMaxMarks = theoryMaxMarksObject ? parseFloat(theoryMaxMarksObject[subjectName]) : 0;
        // const practicalMaxMarksObject = isPractical ? this.resultStructureInfo.practicalMaxMarks.find((practicalMaxMark: any) => practicalMaxMark && practicalMaxMark.hasOwnProperty(subjectName)) : null;
        const practicalMaxMarksObject = isPractical && this.resultStructureInfo.practicalMaxMarks ? this.resultStructureInfo.practicalMaxMarks.find((practicalMaxMark: any) => practicalMaxMark && practicalMaxMark.hasOwnProperty(subjectName)) : null;
        const practicalMaxMarks = practicalMaxMarksObject ? parseFloat(practicalMaxMarksObject[subjectName]) : 0;
        const totalMaxMarks = theoryMaxMarks + practicalMaxMarks;
        const totalGettingMarksPercentile = ((totalMarks / totalMaxMarks) * 100).toFixed(0);
        const gradeMaxMarks = this.resultStructureInfo.gradeMaxMarks;
        const gradeMinMarks = this.resultStructureInfo.gradeMinMarks;
        const grade = gradeMaxMarks.reduce((grade: string, gradeRange: any, i: number) => {
          const maxMarks = parseFloat(String(Object.values(gradeRange)[0]));
          const minMarks = parseFloat(String(Object.values(gradeMinMarks[i])[0]));
          return parseFloat(totalGettingMarksPercentile) >= minMarks && parseFloat(totalGettingMarksPercentile) <= maxMarks ? Object.keys(gradeRange)[0] : grade;
        }, '');
        return {
          subject: subjectName,
          theoryMarks: theoryMarks,
          practicalMarks: practicalMarks,
          totalMarks: totalMarks,
          grade: grade,
        };
      });
    };
    const marks = calculateGrades(examResult.theoryMarks, !!examResult.practicalMarks);
        const grandTotalMarks = marks.reduce((total: number, item: any) => total + item.totalMarks, 0);
        const percentile = parseFloat(((grandTotalMarks / totalMaxMarks) * 100).toFixed(2));
        const basePercentile = parseFloat(percentile.toFixed(0));
        const percentileGrade = this.resultStructureInfo.gradeMaxMarks.reduce((grade: string, gradeRange: any, i: number) => {
          const maxMarks = parseFloat(String(Object.values(gradeRange)[0]));
          const minMarks = parseFloat(String(Object.values(this.resultStructureInfo.gradeMinMarks[i])[0]));
          return basePercentile >= minMarks && basePercentile <= maxMarks ? Object.keys(gradeRange)[0] : grade;
        }, '');
        let examResultInfo = {
          marks: marks,
          grandTotalMarks: grandTotalMarks,
          totalMaxMarks: totalMaxMarks,
          percentile: percentile,
          percentileGrade: percentileGrade,
          resultStatus: resultStatus
        };
    if (this.examResultForm.valid) {
      this.examResultForm.value.resultDetail = examResultInfo;
      this.examResultForm.value.adminId = this.adminId;
      if (this.updateMode) {
        this.examResultService.updateExamResult(this.examResultForm.value).subscribe((res: any) => {
          if (res) {
            this.successDone();
            this.successMsg = res;
            console.log(res)
          }
        }, err => {
          this.errorCheck = true;
          this.errorMsg = err.error;
        })
      } else {
        if (this.practicalSubjects.length === 0) {
          delete this.examResultForm.value.type.practicalMarks;
        }
        this.examResultForm.value.createdBy = "Admin";
        this.examResultForm.value.examType = this.selectedExam;
        this.examResultForm.value.stream = this.stream;
        this.examResultForm.value.class = this.cls;
        this.examResultService.addExamResult(this.examResultForm.value).subscribe((res: any) => {
          if (res) {
            this.successDone();
            this.successMsg = res;
          }
        }, err => {
          this.errorCheck = true;
          this.errorMsg = err.error;
        })
      }
    }
  }

  examResultDelete(id: String) {
    this.examResultService.deleteExamResult(id).subscribe((res: any) => {
      if (res) {
        this.successDone();
        this.successMsg = res;
        this.deleteById = '';
      }
    })
  }


  handleImport($event: any) {
    this.fileChoose = true;
    const files = $event.target.files;
    if (files.length) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const wb = read(event.target.result);
        const sheets = wb.SheetNames;

        if (sheets.length) {
          const rows = utils.sheet_to_json(wb.Sheets[sheets[0]]);
          this.bulkResult = rows;
        }
      }
      reader.readAsArrayBuffer(file);
    }

  }

  addBulkExamResult() {
    let resultData = {
      examType: this.selectedExam,
      stream: this.stream,
      createdBy: "Admin",
      bulkResult: this.bulkResult
    }

    this.examResultService.addBulkExamResult(resultData).subscribe((res: any) => {
      if (res) {
        this.successDone();
        this.successMsg = res;
      }
    }, err => {
      this.errorCheck = true;
      this.errorMsg = err.error;
    })
  }

  handleExport() {
    let rollNumber = "rollNumber";
    const headings = [[
      rollNumber,
      'Class',
      'Hindi',
      'English',
      'Sanskrit',
      'Maths',
      'Science'
    ]];
    const wb = utils.book_new();
    const ws: any = utils.json_to_sheet([]);
    utils.sheet_add_aoa(ws, headings);
    utils.sheet_add_json(ws, this.bulkResult, { origin: 'A2', skipHeader: true });
    utils.book_append_sheet(wb, ws, 'Report');
    writeFile(wb, 'Result.xlsx');
  }
}