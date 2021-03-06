import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Utilitarios } from './../shared/utilitarios';
import { HostnameConstants } from './../shared/constantes/hostname.constants';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private ENDPOINT  = 'T_Ingreso';
  private URL_BASE = Utilitarios.crearURLSolicitud(HostnameConstants.VALENTINE_WEBAPI.host);
  private URL_SOLICITUD: string;
  private URL: string;

  constructor(private http: HttpClient) {
    this.URL_SOLICITUD = `${this.URL_BASE}${this.ENDPOINT}`;
  }

  public obtenerReporteRentabilidad(idInversor: string) {
    this.URL = `${this.URL_SOLICITUD}/GetReporteRentabilidad?codigoInversor=${idInversor}`;
    console.log(this.URL);
    return this.http.get(this.URL);
  }


}
