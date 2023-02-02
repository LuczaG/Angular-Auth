import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Alert, AlertType } from '@app/_models';
import { AlertService } from '@app/_services/alert.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-alert',
    templateUrl: './alert.components.html',
})

export class AlertComponent implements OnInit, OnDestroy {
    @Input() id = 'default-alert';
    @Input() fade = 'true';

    alerts: Alert[] = [];
    alertSubscription: Subscription;
    routeSubscription: Subscription;


    constructor(private router: Router, private alertService: AlertService) { }

    ngOnInit(): void {
        // feliratkozás az új alertekre
        this.alertSubscription = this.alertService.onAlert(this.id)
            .subscribe(alert => {
                // alertek törlése, ha üres alert érkezik
                if (!alert.message) {
                    // alertek kiszűrése a "keepAfterRouteChange" jelző nélkül
                    this.alerts = this.alerts.filter(x => x.keepAfterRouteChange);

                    // a többiről távolítsuk el a "keepAfterRouteChange" jelzőt
                    this.alerts.forEach(x => delete x.keepAfterRouteChange);
                    return;
                }

                // alert hozzáadása a tömbhöz
                this.alerts.push(alert);

                // szükség esetén automatikusan eltávolítjuk az alertet
                if (alert.autoClose) {
                    setTimeout(() => this.removeAlert(alert), 3000);
                }
            });

            // helyváltozásnál ürítsük ki az alerteket
            this.routeSubscription = this.router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                this.alertService.clear(this.id);
            }
        });
    }

    ngOnDestroy(): void {
        // iratkozzunk le a memúriatúlcsorulás elkerülése érdekében
        this.alertSubscription.unsubscribe();
        this.routeSubscription.unsubscribe();
    }

    removeAlert(alert: Alert) {
        // ellenőrizzük le, hogy már eltávolították-e, hogy
        // elkerüljük az automatikus bezáráskor jelentkező hibákat
        if (!this.alerts.includes(alert)) return;

        if (this.fade) {
            //fade out
            alert.fade = true;

            // alert eltávolítása a fade out után
            setTimeout(() => {
                this.alerts = this.alerts.filter(x => x !== alert)
            }, 250);
        } else {
            // alert eltávolítása
            this.alerts = this.alerts.filter(x => x !== alert);
        }
    }

    cssClass(alert: Alert){
        if (!alert) return "";

        const classes = ['alert', 'alert-dismissible', 'mt-4', 'container' ];

        const alertTypeClass = {
            [AlertType.Success]: 'alert-succsess',
            [AlertType.Error]: 'alert-danger',
            [AlertType.Info]: 'alert-info',
            [AlertType.Warning]: 'alert-warning'
        }

        if (alert.type !== undefined) {
            classes.push(alertTypeClass[alert.type]);
        }

        if (alert.fade) {
            classes.push('fade');
        }

        return classes.join(' ');
    }
}