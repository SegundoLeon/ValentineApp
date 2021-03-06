import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ParametroModel } from './parametro.model';
import { Utilitarios } from './../shared/utilitarios';
import { HostnameConstants } from './../shared/constantes/hostname.constants';

@Injectable({
  providedIn: 'root'
})
export class ParametroService  {
  private ENDPOINT  = 'Parametros';
  private URL_BASE = Utilitarios.crearURLSolicitud(HostnameConstants.VALENTINE_WEBAPI.host);
  private URL_SOLICITUD: string;
  private URL: string;

  constructor(private http: HttpClient) {
    this.URL_SOLICITUD = `${this.URL_BASE}${this.ENDPOINT}`;
  }

  public getByPadreID(padreId: number) {
    this.URL = `${this.URL_SOLICITUD}/${padreId}`;
    return this.http.get<ParametroModel[]>(this.URL);
  }
}


