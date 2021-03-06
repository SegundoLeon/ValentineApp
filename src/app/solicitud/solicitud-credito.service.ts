import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpResponse, HttpResponseBase, HttpParams, HttpHeaders } from '@angular/common/http';
import { Utilitarios } from '../shared/utilitarios';
import { HostnameConstants } from '../shared/constantes/hostname.constants';
//import { RegistroPaso1Model } from './registroPaso1.model';
import { SolicitudCreditoRequestF1Model } from './solicitud-credito-request-f1.model';
import { SolicitudCreditoResponseF1Model } from './solicitud-credito-response-f1.model';
import { SolicitudCreditoRequestF2Model } from './solicitud-credito-request-f2.model';
import { SolicitudCreditoResponseF2Model } from './solicitud-credito-response-f2.model';

import { RegistroPaso2Model } from './registroPaso2.model';
import { ReniecConsultaModel } from './reniecConsulta.model';
import { ReniecRespuestaModel } from './reniecRespuesta.model';
import { CorreoRespuestaModel } from './correoRespuesta.model';
import { Observable, Subject, throwError, of } from 'rxjs';
import { map, tap, take, catchError } from 'rxjs/operators';

import { BaseResponse, CreditApplication, DetailProfitability, DetailProfitabilityRequest,
         DetailProfitabilityResponse, Parameter, ParameterDTO, Profitability, ProfitabilityDTO,
         SearchCreditApplicationDTO, SolicitudCredito, SolicitudCreditoRequest, UbigeoDTO} from './credit-application.model';
import { Solicitud, SolicitudAdapter } from './solicitud-model';
import { ParametroConstants } from './parametro.constants';


@Injectable({
  providedIn: 'root'
})
export class SolicitudCreditoService {
  public solicitudCredito: SolicitudCredito = new SolicitudCredito();
  private httpOptions = { headers: new HttpHeaders({'Content-Type': 'application/json'}) };
  private T_SOLICITUD_ENDPOINT  = 'CuentaPrestamo';
  //private T_SOLICITUD_ENDPOINT  = 'T_SolicitudCredito';
  private PARAMETRO = 'Parametros';
  //private PARAMETRO = 'T_Parametro';
  private UBIGEO = 'Ubigeos';
  //private UBIGEO = 'T_Ubigeo';
  private INGRESO = 'T_Ingreso';
  private ARCHIVO = 'T_Archivo';
  private URL_BASE = Utilitarios.crearURLSolicitud(HostnameConstants.VALENTINE_WEBAPI.host);
  private URL_SOLICITUD: string;
  private URL: string;

  private methods = {
    params: {
      getByPadreId: (id: string) => `${HOST}/${MODULES.params}/GetByPadreID?id=${id}`,
    },
    creditApplication: {
      searchCreditApplication: () => `${HOST}/${MODULES.creditApplication}/SearchSolicitudCredito`,
      getSolicitudCreditoByCode: (code: string) => `${HOST}/${MODULES.creditApplication}/GetSolicitudCreditoByCodigo?codigo=${code}`,
      saveSolicitud: () => `${HOST}/${MODULES.creditApplication}/GuardarSolicitud`,
    },
    ubigeo: {
      getByPadreId: (id: string | number) => `${HOST}/${MODULES.ubigeo}/GetByPadreID?id=${id}`,
    },
    ingreso: {
      getReporteRentabilidad: (cod: string) => `${HOST}/${MODULES.ingreso}/GetReporteRentabilidad?codigoInversor=${cod}`,
      getReporteRentabilidadDetalle: () => `${HOST}/${MODULES.ingreso}/GetReporteRentabilidadDetalle`,
    },
    file: {
      GetByApplicationCode: (cod: string) => `${HOST}/${MODULES.file}/GetByCodigoSolCredito?id=${cod}`,
    },
  };

  constructor(private router: Router, private httpClient: HttpClient,
              private solicitudAdapter: SolicitudAdapter) {
    this.URL_SOLICITUD = `${this.URL_BASE}${this.T_SOLICITUD_ENDPOINT}`;
  }

  // Manejo de errores aun no utlizado.
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      return of(result as T);
    };
  }

  // Permite el primer paso del proceso de solicitud de credito
  // Servicio probado con exito, falta agregar la gestion de errores
  public registerFirstStep(model: SolicitudCreditoRequestF1Model): Observable<SolicitudCreditoResponseF1Model> {
    this.URL = `${this.URL_SOLICITUD}`;
    return this.httpClient.post<SolicitudCreditoResponseF1Model>(this.URL, model);
  }

  // Permite el segundo paso del proceso de solicitud de credito
  public registerSecondStep(id: string, model: SolicitudCreditoRequestF2Model): Observable<SolicitudCreditoResponseF2Model> {
    this.URL = `${this.URL_SOLICITUD}/${id}`;
    return this.httpClient.put<SolicitudCreditoResponseF2Model>(this.URL, model).pipe(catchError(this.manejoError));
  }

  // Para buscar solicitudes de credito
  getCreditApplication(solicitudRequest: SearchCreditApplicationDTO): Observable<Solicitud[]> {
    this.URL = `${this.URL_SOLICITUD}/SearchSolicitudCredito`;
    return this.httpClient.post<any[]>(this.URL, solicitudRequest).pipe(
      map(res => res['data'].map(item => this.solicitudAdapter.adapt(item))),
    );
  }








  // Simula validar datos en la RENIEC
  public validarDatosReniec(model: ReniecConsultaModel): Observable<any> {
    return this.httpClient.post(HostnameConstants.RENIEC_WEBAPI.host, model)
          .pipe(catchError(this.manejoError));
          //tap(response => console.log(response)), map(response => response.toString),
  }

  private manejoError(respuestaError: HttpErrorResponse) {
    if(respuestaError.error instanceof ErrorEvent) {
      console.error('Error en el cliente: ', respuestaError.error.message);
    } else {
      console.error('Error en el servidor: ', respuestaError);
    }
    return throwError('Hay un problema con el servicio. Estaremos trabajando para resolver el problema.')
  }

  // Verifica si el solicitante tiene alguna solicitud de credito pendiente
  public validarSolicitudExistente(DNI: string) {
    this.URL = `${this.URL_SOLICITUD}/ValidarSolicitudExistente/${DNI}/DNI`;
    return this.httpClient.get(this.URL);
  }

  // Envia correo electronico a los solicitantes
  public enviarMail(model: CorreoRespuestaModel) {
    this.URL = `${this.URL_SOLICITUD}/EnviarMail`;
    return this.httpClient.post(this.URL, model);
  }

  getCreditApplicationByCode(code: string): Observable<SolicitudCredito> {
    return this.httpClient
      .get<SolicitudCredito>(this.methods.creditApplication.getSolicitudCreditoByCode(code)).pipe(
        map<SolicitudCredito, SolicitudCredito>((solicitudCredito) => {
          const fechaNacimientoArray = (solicitudCredito.FechaNacimiento || '').toString().split('/');
          const year = +fechaNacimientoArray[2] || 0;
          const month = +fechaNacimientoArray[1] || 0;
          const day = +fechaNacimientoArray[0] || 0;
          solicitudCredito.SeguroDesgravamenId = +solicitudCredito.SeguroDesgravamenId;
          solicitudCredito.FechaNacimiento = year && month > -1 && day ? new Date(year, month - 1, day) : solicitudCredito.FechaNacimiento;
          return solicitudCredito;
        })
      );
  }

  public goEdit(application: CreditApplication): void {
    this.router.navigate(['credit-application/edit', application.code, 'general']);
  }



  // Informacion para los combos de los formularios CODIGO IMPORTADO
  getAllStatusCreditApplication(): Observable<Parameter[]> {
    return this.getAnyParamList(PARAMS_IDS.statusCreditApplication);
  }

  getAllCreditDestination(): Observable<Parameter[]> {
    return this.getAnyParamList(PARAMS_IDS.creditDestination);
  }

  getAllDocumentType(): Observable<Parameter[]> {
    return this.getAnyParamList(PARAMS_IDS.documentType);
  }

  getAllGender(): Observable<Parameter[]> {
    return this.getAnyParamList(PARAMS_IDS.gender);
  }

  getAllGrade(): Observable<Parameter[]> {
    return this.getAnyParamList(PARAMS_IDS.grade);
  }

  getAllMaritalStatus(): Observable<Parameter[]> {
    return this.getAnyParamList(PARAMS_IDS.maritalStatus);
  }

  getAllActivityArea(): Observable<Parameter[]> {
    return this.getAnyParamList(PARAMS_IDS.activityArea);
  }

  getAllJobs(): Observable<Parameter[]> {
    return this.getAnyParamList(PARAMS_IDS.job);
  }

  getAllBank(): Observable<Parameter[]> {
    return this.getAnyParamList(PARAMS_IDS.bank);
  }

  getAllTypeAccount(): Observable<Parameter[]> {
    return this.getAnyParamList(PARAMS_IDS.typeAccount);
  }

  getSeguroDesgravamen(): Observable<Parameter[]> {
    return this.getAnyParamList(PARAMS_IDS.seguroDesgravament);
  }

  getUbigeo(parentId: string | number = '0'): Observable<UbigeoDTO[]> {
    return this.httpClient
      .get<UbigeoDTO[]>(this.methods.ubigeo.getByPadreId(parentId));
  }

  saveApplication(solicitud: SolicitudCreditoRequest): Observable<any> {
    return this.httpClient
      .post(this.methods.creditApplication.saveSolicitud(), solicitud);
  }

  getCodeByMonthName(month: string): number {
    return MONTH.indexOf(month) + 1;
  }

  getFilesByApplicationCode(code: string): Observable<any> {
    return this.httpClient
      .get<any>(this.methods.file.GetByApplicationCode(code)).pipe(
        map<any, any>((response) => {
          return response;
        })
      );
  }

  getAnyParamList(id: string): Observable<Parameter[]> {
    return this.httpClient.get<ParameterDTO[]>(this.methods.params.getByPadreId(id)).pipe(
      map<ParameterDTO[], Parameter[]>((parametersDTO: ParameterDTO[]) => {// Agregado recien el 10/1
        parametersDTO = parametersDTO || [];
        return parametersDTO.map((parameterDto) => {
          return {
            code: parameterDto.Codigo,
            name: parameterDto.Nombre
            //parent: parameterDto.Padre,
          };
        });
      })
    );
  }
}


//const HOST = 'http://valentineservices.azurewebsites.net/api';
const HOST = 'http://valentinebe.azurewebsites.net/api';
const MODULES = {
  params: 'Parametros',
  creditApplication: 'CuentaPrestamo',
  ubigeo: 'Ubigeos',
  ingreso: 'T_Ingreso',
  file: 'T_Archivo',
};

const PARAMS_IDS = {
  statusCreditApplication: '40',
  creditDestination: '10',
  documentType: '13',
  gender: '1',
  grade: '4',
  maritalStatus: '16',
  seguroDesgravament: '37',
  activityArea: '23',
  job: '26',
  typeAccount: '29',
  bank: '32',
};

const MONTH: string[] = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Setiembre',
  'Octubre',
  'Noviembre',
  'Diciemnbre',
];
