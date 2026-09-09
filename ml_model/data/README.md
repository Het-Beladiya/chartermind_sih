# Maritime Freight & Port Intelligence Datasets

This directory contains the historical ground-truth datasets powering the Machine Learning, statistical, and operational constraint engines in the **CharterMind** platform.

---

## Dataset Catalog

### 1. `bdi_index_monthly.csv`
- **Purpose**: Primary training and validation dataset for multi-horizon freight rate forecasting.
- **Source**: Audited historical records of the Baltic Dry Index (BDI), the global benchmark for dry bulk shipping freight costs.
- **Rows**: 308 monthly records.
- **Date Range**: January 1999 to August 2024 (`1999-01-01` to `2024-08-01`).
- **Target Variable**: `Price` (Monthly closing Baltic Dry Index in points).
- **Key Columns**:
  - `Date`: Monthly timestamp (`YYYY-MM-DD`).
  - `Price`: Baltic Dry Index monthly close (points).
  - `Open`: Monthly opening index.
  - `High`: Monthly maximum index.
  - `Low`: Monthly minimum index.
  - `Vol`: Monthly traded volume / futures contracts.
  - `Change %`: Month-over-month percentage return.

### 2. `bdi_vessel_class_subindices.csv`
- **Purpose**: Calibrates non-linear elasticity models mapping the aggregate Baltic Dry Index (BDI) to individual vessel class subindices.
- **Source**: Baltic Exchange Subindex data feeds.
- **Rows**: 5,913 daily observations.
- **Date Range**: 1999 to 2024.
- **Target Variables**:
  - `BCI`: Baltic Capesize Index (~180,000 DWT vessels).
  - `BPI`: Baltic Panamax Index (~75,000–82,000 DWT vessels).
  - `BSI`: Baltic Supramax Index (~55,000–64,000 DWT vessels).
  - `BHI`: Baltic Handysize Index (~28,000–38,000 DWT vessels).
- **Key Columns**:
  - `Date`: Trading day timestamp (`YYYY-MM-DD`).
  - `BDI`: Baltic Dry Index benchmark.
  - `BCI`, `BPI`, `BSI`, `BHI`: Daily subindex points.

### 3. `india_eastcoast_port_specs.csv`
- **Purpose**: Ground-truth navigational, physical, and infrastructural constraints for major Indian East Coast deepwater and riverine ports.
- **Source**: Ministry of Ports, Shipping and Waterways (MoPSW) & Port Trust Marine Pilotage Handbooks.
- **Rows**: 7 audited ports (*Paradip, Visakhapatnam, Dhamra, Chennai, Kolkata, Haldia, Kakinada*).
- **Key Columns**:
  - `port_name`: Name of the port authority.
  - `state`: Coastal state in India.
  - `channel_depth_m`: Navigational approach channel draft (meters).
  - `max_draft_m`: Maximum permissible vessel draft alongside berth (meters).
  - `max_beam_m`: Maximum vessel width permitted through breakwaters/locks (meters).
  - `max_loa_m`: Maximum Length Overall permissible at bulk berths (meters).
  - `max_deadweight_dwt`: Maximum displacement capacity in deadweight tonnes.
  - `harbor_type`: Coastal, Artificial Lagoon, Deepwater Island, or River Estuary.
  - `pilotage_compulsory`: Statutory pilot boarding requirements.
  - `solid_bulk_facilities`: Mechanization rating (conveyors, unloaders, stacker-reclaimers).
  - `latitude`, `longitude`: Geospatial harbor coordinates.

### 4. `india_eastcoast_port_traffic_history.csv`
- **Purpose**: 10-year historical cargo throughput records used to compute baseline traffic distributions, Z-score congestion metrics, and capacity utilization.
- **Source**: Indian Ports Association (IPA) Annual Operational Statistics.
- **Rows**: 77 audited fiscal year records (FY 2005–06 to FY 2022–23).
- **Key Columns**:
  - `port`: Port name.
  - `fiscal_year`: Fiscal year string (`YYYY-YY`).
  - `overseas_unloaded`, `overseas_loaded`, `overseas_total`: International dry bulk / general cargo ('000 metric tonnes).
  - `coastal_unloaded`, `coastal_loaded`, `coastal_total`: Domestic coastal shipping ('000 metric tonnes).
  - `total_traffic`: Total handled cargo volume ('000 metric tonnes).

### 5. `vessel_class_rate_ratio_reference.csv`
- **Purpose**: Baseline ratios for Time Charter Equivalent (TCE) earnings multipliers and deadweight tonnage boundaries.
- **Rows**: 4 major commercial bulk classes (*Capesize, Panamax, Supramax, Handysize*).
- **Key Columns**:
  - `vessel_class`: Class moniker.
  - `dwt_min`, `dwt_max`: Representative deadweight tonnage range.
  - `base_tce_ratio`: Benchmark ratio relative to aggregate BDI.

### 6. `bdi_index_daily_sample.csv`
- **Purpose**: High-frequency sample for intraday/daily volatility analysis and validation.
- **Rows**: 100 recent daily observations.
