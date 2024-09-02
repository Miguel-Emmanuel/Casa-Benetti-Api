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
    ACCOUNTPAYABLE = "AccountPayable",
    PROFORMA = "Proforma",
    ACCOUNTPAYABLEHISTORY = "AccountPayableHistory",
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
    ORDENES_DE_COMPRA = 'Órdenes de compra',
    CUENTAS_POR_PAGAR = 'Cuentas por pagar',
    COMISIONES = 'Comisiones',
    INVENTARIOS = 'Inventarios',
    LOGISTICA = 'Logística',
    TIPO_CAMBIO = 'Tipo de cambio',
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
    TRANSITO_NACIONAL = 'Transito Nacional',
    TRANSITO_INTERNACIONAL = 'Transito internacional',
    RECOLECCION = 'Recoleccion',
    BODEGA_NACIONAL = 'Bodega nacional',
    PROCESO_ADUANA = 'Proceso Aduana',
    BODEGA_INTERNACIONAL = 'Bodega Internacional',
    SHOWROOM = 'Showroom',
    BODEGA = 'Bodega',
    ENTREGADO = 'Entregado',
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

export enum CommissionPaymentRecordStatus {
    PENDIENTE = 'Pendiente',
    PAGADO = 'Pagado',
}

export enum CommissionPaymentStatus {
    PENDIENTE = 'Pendiente',
    PAGADO = 'Pagado',
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

// export enum PurchaseOrdersStatus {
//     NUEVA = 'Nueva',
//     ENVIADA_AL_PROVEDOR = 'Enviada al proveedor',
//     EN_PRODUCCION = 'En producción',
//     FINALIZADA = 'Finalizada',
//     ENTREGA = 'Entregada',
// }
export enum PurchaseOrdersStatus {
    NUEVA = 'Nueva',
    ENVIADA_AL_PROVEDOR = 'Enviada al proveedor',
    EN_PRODUCCION = 'En producción',
    EN_RECOLECCION = 'En recoleccion',
    BODEGA_INTERNACIONAL = 'Bodega Internacional',
    TRANSITO_INTERNACIONAL = 'Transito internacional',
    PROCESO_ADUANA = 'Proceso Aduana',
    BODEGA_NACIONAL = 'Bodega nacional',
    TRANSITO_NACIONAL = 'Transito nacional',
    ENTREGA_PARCIAL = 'Entrega parcial',
    ENTREGA = 'Entregada',
}

export enum DeliveryRequestStatusE {
    POR_VALIDAR = 'Por validar',
    PROGRAMADA = 'Programada',
    ENTREGA_PARCIAL = 'Entrega parcial',
    ENTREGA_COMPLETA = 'Entrega completa',
    RECHAZADA = 'Rechazada',
}


export enum AccountPayableHistoryStatusE {
    PENDIENTE = 'Pendiente',
    PAGADO = 'Pagado',
}

export enum TypeCommisionE {
    MAIN_PROJECT_MANAGER = 'Project manager principal',
    PROJECT_MANAGER = 'Project manager secundario',
    DESIGNER = 'Proyectista',
}

export enum ProformaCurrencyE {
    EURO = 'Euro',
    USD = 'Dolar',
    PESO_MEXICANO = 'Peso Mexicano',
}

export enum ConvertCurrencyToEUR {
    EURO = 1,
    USD = 0.92,
    MXN = 0.051,
}
export enum ConvertCurrencyToUSD {
    USD = 1,
    EURO = 1.09,
    MXN = 0.055,
}
export enum ConvertCurrencyToMXN {
    MXN = 1,
    USD = 18.16,
    EURO = 19.71,
}


export enum InventoryMovementsTypeE {
    ENTRADA = 'Entrada',
    SALIDA = 'Salida',
}



export enum InventoriesReasonE {
    DESCARGA_CONTENEDOR = 'Descarga de contenedor',
    DESCARGA_RECOLECCION = 'Descarga de recolección',
    REPARACION = 'Reparación',
    PRESTAMO = 'Préstamo',
    DEVOLUCION = 'Devolución',
    ENTRADA_MANUAL = 'Entrada manual',
}

export enum DestinationTypeE {
    ALMACENES = 'Almacenes',
    SUCURSALES = 'Sucursales',
}


export enum InventoriesIssueE {
    REASIGNAR = 'Reasignar',
    ENTREGA_CLIENTE = 'Entrega a cliente',
    CONTENEDOR = 'Contenedor',
    OTRO = 'Otro',
}


export enum CollectionDestinationE {
    BODEGA_INTERNACIONAL = 'Bodega Internacional',
    CONTENEDOR = 'Contenedor',
}


export enum ContainerStatus {
    NUEVO = 'Nuevo',
    EN_TRANSITO = 'En tránsito',
    ENTREGADO = 'Entregado',
}

export enum CollectionStatus {
    PROGRAMADA = 'Programada',
    COMPLETADA = 'Completada',
}


export enum OriginExpenseE {
    PROYECTO = 'Proyecto',
    GENERAL = 'General',
    SUCURSAL = 'Sucursal',
}

export enum PaymentMethodE {
    EFECTIVO = 'Efectivo',
    TRANSFERENCIA = 'Transferencia',
    OTRO = 'Otros',
}



export enum TypeQuotationE {
    GENERAL = 'General',
    SHOWROOM = 'Showroom',
}

export enum ShowRoomDestinationE {
    GENERAL = 'General',
    SHOWROOM = 'Showroom',
}


export enum WarehouseLocationE {
    NACIONAL = 'Nacional',
    INTERNACIONAL = 'Internacional',
}

export enum ProductTypeE {
    STOCK = 'Stock',
    PEDIDO = 'Pedido',
}
