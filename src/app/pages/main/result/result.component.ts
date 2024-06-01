import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamResultService } from 'src/app/services/exam-result.service';
import { ClassService } from 'src/app/services/class.service';
import { PrintPdfService } from 'src/app/services/print-pdf/print-pdf.service';
import { SchoolService } from 'src/app/services/school.service';
import { AdminAuthService } from 'src/app/services/auth/admin-auth.service';

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})
export class ResultComponent implements OnInit {
  @ViewChild('content') content!: ElementRef;
  errorMsg: string = '';
  examResultForm: FormGroup;
  schoolInfo: any;
  classInfo: any;
  studentInfo: any;
  examResultInfo: any;
  resultStructureInfo: any;
  processedData: any[] = [];
  loader: Boolean = false;
  adminId!: any;


  examResults: any[] = [];
  constructor(private fb: FormBuilder, private adminAuthService: AdminAuthService, private schoolService: SchoolService, private printPdfService: PrintPdfService, private examResultService: ExamResultService, private classService: ClassService) {
    this.examResultForm = this.fb.group({
      schoolId: ['100001', [Validators.required, Validators.maxLength(10)]],
      admissionNo: ['81408000', Validators.required],
      class: ['12', Validators.required],
      rollNumber: ['24300', Validators.required],
    })
  }
  ngOnInit(): void {
    let getAdmin = this.adminAuthService.getLoggedInAdminInfo();
    this.adminId = getAdmin?.id;
    this.getClass();
    this.getSchool();
  }


  printContent() {
    this.printPdfService.printElement(this.content.nativeElement);
  }

  downloadPDF() {
    this.printPdfService.generatePDF(this.content.nativeElement, "Result.pdf");
  }

  getSchool() {
    this.schoolService.getSchool(this.adminId).subscribe((res: any) => {
      if (res) {
        this.schoolInfo = res;
      }
    })
  }
  getClass() {
    this.classService.getClassList().subscribe((res: any) => {
      if (res) {
        this.classInfo = res;
      }
    })
  }

  examResult() {

    this.examResultService.singleStudentExamResult(this.examResultForm.value).subscribe((res: any) => {
      if (res) {
        this.loader = true;
        this.studentInfo = res.studentInfo;
        const examResult = res.examResult;
        this.resultStructureInfo = res.examResultStructure;
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
          return marksArray.reduce((total, subjectMarks) => {
            const subjectName = Object.keys(subjectMarks)[0];
            return total + parseFloat(subjectMarks[subjectName]);
          }, 0);
        };
        const totalTheoryMaxMarks = calculateMaxMarks(this.resultStructureInfo.theoryMaxMarks);
        const totalPracticalMaxMarks = examResult.practicalMarks ? calculateMaxMarks(this.resultStructureInfo.practicalMaxMarks) : 0;
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
            const practicalMaxMarksObject = isPractical ? this.resultStructureInfo.practicalMaxMarks.find((practicalMaxMark: any) => practicalMaxMark && practicalMaxMark.hasOwnProperty(subjectName)) : null;
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
        this.examResultInfo = {
          class: examResult.class,
          examType: examResult.examType,
          rollNumber: examResult.rollNumber,
          admissionNo: examResult.admissionNo,
          marks: marks,
          grandTotalMarks: grandTotalMarks,
          totalMaxMarks: totalMaxMarks,
          percentile: percentile,
          percentileGrade: percentileGrade,
          resultStatus: resultStatus
        };
        setTimeout(() => {
          this.loader = false;
        }, 500);
      }
    }, (err: any) => {
      this.errorMsg = err.error.errorMsg;
    });

  }

}