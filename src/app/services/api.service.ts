import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {API_URL} from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private userID: string;

    constructor(
        private http: HttpClient
    ) {
    }

    public setUserID(userID) {
        this.userID = userID;
    }

    private getHeaders() {
        const headers = {
        };
        return new HttpHeaders(headers);
    }

    public get(path: string, data?: any) {
        const ref = this;
        return new Promise((resolve, reject) => {
            return ref.http.get(path, {headers: ref.getHeaders(), params: data})
                .subscribe(
                    response => {
                        resolve(response);
                    },
                    error => {
                        reject(error);
                    },
                    () => {
                    }
                );
        });
    }

    public post(path: string, data?: any, headers?: any) {
        const ref = this;
        return new Promise((resolve, reject) => {
            const options = {
                headers: (headers || ref.getHeaders())
            };
            return ref.http.post(path, data, options)
                .subscribe(
                    response => {
                        resolve(response);
                    },
                    error => {
                        reject(error);
                    },
                    () => {
                    }
                );
        });
    }
}
