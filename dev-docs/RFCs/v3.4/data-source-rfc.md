# Data Sources API

Build a data source API that can encompass services such 
- loaded data
- URLS
- tile service
- WMS
- Incremental fetch with range requests etc.
- programmatic data generation
- ...

### Related

- deck.gl has a semi-internal data source API.
- 



## Main problems

### Refresh / Dirty state handling. 

How does the application (typically deck.gl)) know when to redraw?

```typescript
DataSource.setNeedsRefresh();
DataSource.getNeedsRefresh(clear: boolean = true);
```

## Updates

`DataSource.setProps()`

Typing is a bit messy when overriding child class definitions.

## Declarative usage

Fully declarative usage requires a lifecycle management system, which seems too heavy.



