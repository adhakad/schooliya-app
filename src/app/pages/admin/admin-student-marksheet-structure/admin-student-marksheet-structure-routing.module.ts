import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminStudentMarksheetStructureModule } from './admin-student-marksheet-structure.module';

const routes: Routes = [
  { path: '', component: AdminStudentMarksheetStructureModule }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminStudentMarksheetStructureRoutingModule { }
