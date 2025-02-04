import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import moment from 'moment';

@injectable({scope: BindingScope.TRANSIENT})
export class CalculateScheledDateService {
    constructor() { }

    /**
    * Devuelve listado de fechas feriadas de acuerdo a el artículo 74 de la LFT, siendo estos:
    * I. El 1o. de enero;
    * II. El primer lunes de febrero en conmemoración del 5 de febrero;
    * III. El tercer lunes de marzo en conmemoración del 21 de marzo;
    * IV. El 1o. de mayo;
    * V. El 16 de septiembre
    * VI. El tercer lunes de noviembre en conmemoración del 20 de noviembre;
    * VII. El 1o. de diciembre de cada seis años hasta antes del 2024, a partir del 2024 1ro octubre, cuando corresponda a la transmisión del Poder Ejecutivo Federal;
    * @param year :number | año para calculo de fechas
    * @returns array :moment.Moment[] | lista de fechas feriadas
    * @info https://www.gob.mx/profedet/es/articulos/sabes-cuales-son-los-dias-de-descanso-obligatorios-163134?idiom=es
    */
    public generateHolidaysMexico(year: number) {
        const holidays = [
            moment(`${year}-01-01`), // Año Nuevo año actual
            this.getFirstMondayOfMonth(year, 2), // 1er lunes de febrero
            this.getThirdMondayOfMonth(year, 3), // 3er lunes de marzo
            moment(`${year}-05-01`), // Día del Trabajo
            moment(`${year}-09-16`), // Día de la Independencia
            this.getThirdMondayOfMonth(year, 11), // 3er lunes de noviembre
            moment(`${year}-12-25`), // Navidad
            moment(`${year + 1}-01-01`) //Año nuevo siguiente año
        ];

        // se agrega fecha cuando corresponda a la transmisión del Poder Ejecutivo Federal;
        if (year >= 2024 && year % 6 === 0) {
            holidays.push(moment(`${year}-10-01`)) // 1o. de octubre cada seis años a partir del 2024
        }
        else if (year % 6 === 0) {
            holidays.push(moment(`${year}-12-01`)); // 1o. de diciembre cada seis años hasta 2018
        }

        return holidays;
    }

    /**
     * Devuelve el primer lunes del mes
     * @param year :Date | fecha a validar
     * @param holidaysMexico :moment.Moment[] | cantidad de días habiles a sumar a la fecha actual se obtiene de la funcion generateHolidaysMexico
     * @returns true or false :boolean | regresa true si la fecha es un día feriado oficial en méxico
     */
    public getFirstMondayOfMonth(year: number, month: number) {
        const formattedMonth = month < 10 ? `0${month}` : month;
        // Obtener el primer lunes del mes proporcionado en el año dado
        return moment(`${year}-${formattedMonth}-01`).startOf('month').day('Monday');
    }

    /**
     * Devuelve la fecha que resulta al añadir N días hábiles considerando los días feriados en México de acuerdo a el artículo 74 de la LFT.
     * @param date :Date | fecha a validar
     * @param holidaysMexico :moment.Moment[] | cantidad de días habiles a sumar a la fecha actual se obtiene de la funcion generateHolidaysMexico
     * @returns true or false :boolean | regresa true si la fecha es un día feriado oficial en méxico
     */
    public getThirdMondayOfMonth(year: number, month: number) {
        const formattedMonth = month < 10 ? `0${month}` : month;
        // Obtener el tercer lunes del mes proporcionado en el año dado
        return moment(`${year}-${formattedMonth}-01`).startOf('month').day('Monday').add(14, 'days');
    }

    /**
     * Devuelve la fecha que resulta al añadir N días hábiles considerando los días feriados en México de acuerdo a el artículo 74 de la LFT.
     * @param date :Date | fecha a validar
     * @param holidaysMexico :moment.Moment[] | cantidad de días habiles a sumar a la fecha actual se obtiene de la funcion generateHolidaysMexico
     * @returns true or false :boolean | regresa true si la fecha es un día feriado oficial en méxico
     */
    public isHolidayMexico(date: moment.Moment, holidaysMexico: moment.Moment[]) {
        return holidaysMexico.some(holiday => holiday.isSame(date, 'day'));
    }

    /**
     * Devuelve la fecha que resulta al añadir N días hábiles considerando los días feriados en México de acuerdo a el artículo 74 de la LFT.
     * @param currentDate :Date | fecha para inicio del calculo
     * @param numberOfBusinessDays :number | cantidad de días habiles a sumar a la fecha actual
     * @returns date :Date | la nueva fecha segun los días hábiles añadidos.
     */
    public addBusinessDays(currentDate: Date, numberOfBusinessDays: number) {
        let date = moment(currentDate); // Convertir la fecha actual a un objeto moment
        const holidaysMexico = this.generateHolidaysMexico(date.year());

        let daysAdded = 0;

        while (daysAdded < numberOfBusinessDays) {
            date.add(1, 'days'); // Añadir un día
            // Si el día añadido no es sábado, domingo ni feriado en México, incrementar la cuenta de días hábiles
            if (date.day() !== 0 && date.day() !== 6 && !this.isHolidayMexico(date, holidaysMexico)) {
                daysAdded++;
            }
        }

        return date.toDate();
    }

    /**
     * Devuelve la fecha que resulta al añadir N días hasta obtener un Martes o Jueves considerando los días feriados en México de acuerdo a el artículo 74 de la LFT.
     * @param currentDate :Date | fecha para inicio del calculo
     * @returns date :Date | la nueva fecha mas próxima a un Martes o Jueves
     */
    public getNextTuesdayOrThursday(currentDate: Date) {
        let date = moment(currentDate)
        // Obtener el día de la semana (0 para Domingo, 1 para Lunes, ..., 6 para Sábado)
        const dayOfWeek = date.day();
        const holidaysMexico = this.generateHolidaysMexico(date.year());


        // Verificar si es Martes o Jueves
        if (dayOfWeek === 2 || dayOfWeek === 4) {
            // Si ya es Martes o Jueves, devolver la misma fecha
            return currentDate;
        }
        let isTuesdayOrThursday = false;
        // Si es otro día, avanzar al próximo Martes o Jueves
        while (!isTuesdayOrThursday) {
            date.add(1, 'days'); // Añadir un día
            // Si el día añadido no Martes o Jueves ni feriado en México, incrementar la cuenta de días hábiles
            if ((date.day() == 2 || date.day() == 4) && !this.isHolidayMexico(date, holidaysMexico)) {
                isTuesdayOrThursday = true;
            }
        }
        return date.toDate();
    }

}
