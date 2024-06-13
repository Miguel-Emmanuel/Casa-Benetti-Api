export enum LogModelName {
    ORGANIZATION = 'Organization',
    ROLE_MODULE = 'RoleModule',
    USER_DATA = 'UserData',
    ROLE = 'Role',
    USER = 'User',
    DOCUMENT = "Document",
    PRODUCT = 'Product',
    BRANCH = "Branch",
    WAREHOUSE = "Warehouse",
    PROVIDER = "Provider",
    BRAND = "Brand",
    CUSTOMER = "Customer",
    GROUP = "Group",
    EXPENSE = "Expense"
}

export enum LogModificationType {
    CREATE = "Create",
    UPDATE = "Update",
    ACTIVATE = "Activate",
    DEACTIVATE = "Deactivate",
    READ = "Read",
    DELETE = "Delete",
}

export enum ModuleCategories {
    CATALOGS = 'Catálogos',
    COTIZACIONES = 'Cotizaciones'
}

export enum TypeUserE {
    ADMINISTRADOR = 'Administrador',
    INDEPENDIENTE = 'Independiente'
}


export enum AccessLevelRolE {
    PERSONAL = 'Personal',
    SUCURSAL = 'Sucursal',
    GLOBAL = 'Global',
}

export enum ClassificationE {
    ACCESORIO = "Accesorio",
    COCINAS = 'Cocinas',
    COMPLEMENTO = 'Complemento',
    DOCUMENTACION = 'Documentación',
    EQUIPOS = 'Equipos',
    ILUMINACION = 'Iluminación',
    KIT = 'Kit',
    MOBILIARIO = 'Mobiliario',
    SISTEMAS = 'Sistemas',
    SERVICIO = 'Servicio'
}

export enum LocationE {
    COCINA = 'Cocina',
    RECAMARA = 'Recamara',
    SALA = 'Sala',
}

export enum TypeArticleE {
    PRODUCTO_TERMINADO = 'Producto terminado',
    PRODUCTO_ENSAMBLADO = 'Producto ensamblado',
    SUBENSAMBLE = 'Subensamble/Parte',
    SERVICIO = 'Servicio',
}

export enum UOME {
    PIEZA = 'Pieza',
    SET = 'Set/Kit',
    SERVICIO = 'Servicio',
}

export enum CurrencyE {
    EURO = 'Euro',
    USD = 'USD',
    PESO_MEXICANO = 'Peso Mexicano',
}

export enum TypeSaleE {
    VENTA = 'Venta',
    PRESTAMO = 'Prestamo'
}


export enum ExchangeRateE {
    EUR = 'EUR',
    USD = 'USD',
    MXN = 'MXN',
    NA = 'No aplica',
}

export enum StatusQuotationE {
    ENPROCESO = 'En proceso',
    ENREVISION = 'En revisión por Administración',
    CERRADA = 'Cerrada',
    RECHAZADA = 'Rechazada',
}

export enum StatusProduct {
    PEDIDO = 'Pedido'
}

export enum TypeRegimenE {
    PERSONA_FISICA = 'Persona Fisica',
    PERSONA_MORAL = 'Persona Moral',
    PERSONA_FISICA_EMPRESARIAL = 'Persona Fisica con actividad empresarial'
}
