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
    EXPENSE = "Expense",
    QUOTATION = "Quotation",
    ASSEMPLEDPRODUCTS = "AssembledProducts",
    PROJECT = "Project",
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
    COTIZACIONES = 'Cotizaciones',
    PROYECTOS = 'Proyectos',
    CUENTAS_POR_COBRAR = 'Cuentas por cobrar',
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

// export enum LocationE {
//     COCINA = 'Cocina',
//     RECAMARA = 'Recamara',
//     SALA = 'Sala',
// }

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


export enum QuotationProductStatusE {
    PEDIDO = 'Pedido',
}


export enum ExchangeRateE {
    EUR = 'EUR',
    USD = 'USD',
    MXN = 'MXN',
    NA = 'No aplica',
}

export enum ExchangeRateQuotationE {
    EUR = 'EUR',
    USD = 'USD',
    MXN = 'MXN',
}

export enum StatusQuotationE {
    ENPROCESO = 'En proceso',
    ENREVISIONSM = 'En revisión por SM',
    ENREVISIONADMINSITRACION = 'En revisión por Administración',
    CERRADA = 'Cerrada',
    RECHAZADA = 'Rechazada',
}

export enum ProjectStatusE {
    NUEVO = 'Nuevo',
    ENTREGA_PARCIAL = 'Entrega parcial',
    ENTREGA_TOTAL = 'Entrega total',
}

export enum AdvancePaymentStatusE {
    PENDIENTE = 'Pendiente',
    PAGADO = 'Pagado',
}

export enum TypeAdvancePaymentRecordE {
    ANTICIPO_PRODUCTO = 'Anticipo producto',
    ANTICIPO_CLIENTE = 'Anticipo cliente',
    ANTICIPO = 'Anticipo',
}

export enum AdvancePaymentTypeE {
    ARQUITECTO = 'Arquitecto',
    CLIENTE_REFERENCIADO = 'Cliente referenciado',
    PROJECT_MANAGER = 'Project manager',
    SHOWROOM_MANAGER = 'Showroom manager',
    PROYECTISTA = 'Proyectista',
}

export enum CommissionPaymentStatus {
    PENDIENTE = 'Pendiente',
}


export enum StatusProduct {
    PEDIDO = 'Pedido'
}

export enum TypeRegimenE {
    PERSONA_FISICA = 'Persona física',
    PERSONA_MORAL = 'Persona moral',
    PERSONA_FISICA_EMPRESARIAL = 'Persona física con actividad empresarial'
}


export enum PaymentTypeProofE {
    EFECTIVO = 'Efectivo',
    TRANSFERENCIA = 'Transferencia',
    DEPOSITO = 'Depósito',
    CHEQUE = 'Cheque',
    EFECTIVO_EXTERNO = 'Efectivo (Externo)',
    TRANSFERENCIA_EXTERNA = 'Transferencia (Cuenta externa)',
    SALDO_FAVOR = 'Saldo a favor',
}

export enum PurchaseOrdersStatus {
    PENDIENTE = 'Pendiente',
    ENVIADA_AL_PROVEEDOR = 'Enviada al proveedor',
    PAGADA = 'Pagada',
}

export enum TypeCommisionE {
    MAIN_PROJECT_MANAGER = 'Project manager principal',
    PROJECT_MANAGER = 'Project manager secundario',
    DESIGNER = 'Proyectista',
}
