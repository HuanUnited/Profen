export namespace ent {
	
	export class ErrorDefinitionEdges {
	    attempts?: Attempt[];
	
	    static createFrom(source: any = {}) {
	        return new ErrorDefinitionEdges(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.attempts = this.convertValues(source["attempts"], Attempt);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ErrorDefinition {
	    id?: number[];
	    label?: string;
	    base_weight?: number;
	    is_system?: boolean;
	    edges: ErrorDefinitionEdges;
	
	    static createFrom(source: any = {}) {
	        return new ErrorDefinition(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	        this.base_weight = source["base_weight"];
	        this.is_system = source["is_system"];
	        this.edges = this.convertValues(source["edges"], ErrorDefinitionEdges);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ErrorResolutionEdges {
	    node?: Node;
	
	    static createFrom(source: any = {}) {
	        return new ErrorResolutionEdges(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.node = this.convertValues(source["node"], Node);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ErrorResolution {
	    id?: number[];
	    node_id?: number[];
	    error_type_id?: number[];
	    weight_impact?: number;
	    is_resolved?: boolean;
	    resolution_notes?: string;
	    // Go type: time
	    created_at?: any;
	    // Go type: time
	    resolved_at?: any;
	    edges: ErrorResolutionEdges;
	
	    static createFrom(source: any = {}) {
	        return new ErrorResolution(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.node_id = source["node_id"];
	        this.error_type_id = source["error_type_id"];
	        this.weight_impact = source["weight_impact"];
	        this.is_resolved = source["is_resolved"];
	        this.resolution_notes = source["resolution_notes"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.resolved_at = this.convertValues(source["resolved_at"], null);
	        this.edges = this.convertValues(source["edges"], ErrorResolutionEdges);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NodeAssociationEdges {
	    source?: Node;
	    target?: Node;
	
	    static createFrom(source: any = {}) {
	        return new NodeAssociationEdges(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.source = this.convertValues(source["source"], Node);
	        this.target = this.convertValues(source["target"], Node);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NodeAssociation {
	    id?: number;
	    source_id?: number[];
	    target_id?: number[];
	    rel_type?: string;
	    edges: NodeAssociationEdges;
	
	    static createFrom(source: any = {}) {
	        return new NodeAssociation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.source_id = source["source_id"];
	        this.target_id = source["target_id"];
	        this.rel_type = source["rel_type"];
	        this.edges = this.convertValues(source["edges"], NodeAssociationEdges);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NodeClosureEdges {
	    ancestor?: Node;
	    descendant?: Node;
	
	    static createFrom(source: any = {}) {
	        return new NodeClosureEdges(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ancestor = this.convertValues(source["ancestor"], Node);
	        this.descendant = this.convertValues(source["descendant"], Node);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NodeClosure {
	    id?: number;
	    ancestor_id?: number[];
	    descendant_id?: number[];
	    depth?: number;
	    edges: NodeClosureEdges;
	
	    static createFrom(source: any = {}) {
	        return new NodeClosure(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.ancestor_id = source["ancestor_id"];
	        this.descendant_id = source["descendant_id"];
	        this.depth = source["depth"];
	        this.edges = this.convertValues(source["edges"], NodeClosureEdges);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NodeEdges {
	    parent?: Node;
	    children?: Node[];
	    child_closures?: NodeClosure[];
	    parent_closures?: NodeClosure[];
	    outgoing_associations?: NodeAssociation[];
	    incoming_associations?: NodeAssociation[];
	    fsrs_card?: FsrsCard;
	    error_resolutions?: ErrorResolution[];
	
	    static createFrom(source: any = {}) {
	        return new NodeEdges(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.parent = this.convertValues(source["parent"], Node);
	        this.children = this.convertValues(source["children"], Node);
	        this.child_closures = this.convertValues(source["child_closures"], NodeClosure);
	        this.parent_closures = this.convertValues(source["parent_closures"], NodeClosure);
	        this.outgoing_associations = this.convertValues(source["outgoing_associations"], NodeAssociation);
	        this.incoming_associations = this.convertValues(source["incoming_associations"], NodeAssociation);
	        this.fsrs_card = this.convertValues(source["fsrs_card"], FsrsCard);
	        this.error_resolutions = this.convertValues(source["error_resolutions"], ErrorResolution);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Node {
	    id?: number[];
	    title?: string;
	    type?: string;
	    body?: string;
	    metadata?: Record<string, any>;
	    // Go type: time
	    created_at?: any;
	    parent_id?: number[];
	    edges: NodeEdges;
	
	    static createFrom(source: any = {}) {
	        return new Node(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.type = source["type"];
	        this.body = source["body"];
	        this.metadata = source["metadata"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.parent_id = source["parent_id"];
	        this.edges = this.convertValues(source["edges"], NodeEdges);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FsrsCardEdges {
	    node?: Node;
	    attempts?: Attempt[];
	
	    static createFrom(source: any = {}) {
	        return new FsrsCardEdges(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.node = this.convertValues(source["node"], Node);
	        this.attempts = this.convertValues(source["attempts"], Attempt);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FsrsCard {
	    id?: number[];
	    stability?: number;
	    difficulty?: number;
	    elapsed_days?: number;
	    scheduled_days?: number;
	    reps?: number;
	    lapses?: number;
	    state?: string;
	    // Go type: time
	    last_review?: any;
	    // Go type: time
	    due?: any;
	    node_id?: number[];
	    edges: FsrsCardEdges;
	
	    static createFrom(source: any = {}) {
	        return new FsrsCard(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.stability = source["stability"];
	        this.difficulty = source["difficulty"];
	        this.elapsed_days = source["elapsed_days"];
	        this.scheduled_days = source["scheduled_days"];
	        this.reps = source["reps"];
	        this.lapses = source["lapses"];
	        this.state = source["state"];
	        this.last_review = this.convertValues(source["last_review"], null);
	        this.due = this.convertValues(source["due"], null);
	        this.node_id = source["node_id"];
	        this.edges = this.convertValues(source["edges"], FsrsCardEdges);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AttemptEdges {
	    card?: FsrsCard;
	    error_definition?: ErrorDefinition;
	
	    static createFrom(source: any = {}) {
	        return new AttemptEdges(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.card = this.convertValues(source["card"], FsrsCard);
	        this.error_definition = this.convertValues(source["error_definition"], ErrorDefinition);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Attempt {
	    id?: number[];
	    rating?: number;
	    duration_ms?: number;
	    state?: string;
	    stability?: number;
	    difficulty?: number;
	    // Go type: time
	    created_at?: any;
	    card_id?: number[];
	    is_correct?: boolean;
	    error_type_id?: number[];
	    user_answer?: string;
	    edges: AttemptEdges;
	
	    static createFrom(source: any = {}) {
	        return new Attempt(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.rating = source["rating"];
	        this.duration_ms = source["duration_ms"];
	        this.state = source["state"];
	        this.stability = source["stability"];
	        this.difficulty = source["difficulty"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.card_id = source["card_id"];
	        this.is_correct = source["is_correct"];
	        this.error_type_id = source["error_type_id"];
	        this.user_answer = source["user_answer"];
	        this.edges = this.convertValues(source["edges"], AttemptEdges);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	
	
	
	
	
	
	
	

}

