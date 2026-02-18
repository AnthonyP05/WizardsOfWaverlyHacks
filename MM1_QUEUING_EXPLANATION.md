# M/M/1 Queueing Model in Networks

## What is M/M/1?

M/M/1 is a fundamental queueing model used in network analysis and performance evaluation. It describes a system with specific characteristics for arrivals, service, and server capacity.

## Notation Breakdown

The **M/M/1** notation follows the Kendall notation format (A/S/c), where:

- **First M** (Arrival process): Markovian arrivals
  - Packets/requests arrive according to a Poisson process
  - Inter-arrival times follow an exponential distribution
  - Arrivals are memoryless (future arrivals don't depend on past arrivals)

- **Second M** (Service process): Markovian service times
  - Service times follow an exponential distribution
  - Service times are memoryless
  - The rate at which the server processes requests is constant

- **1** (Number of servers): Single server
  - Only one server is available to process requests
  - Requests wait in a queue if the server is busy

## Key Parameters

- **λ (lambda)**: Arrival rate (average number of arrivals per unit time)
- **μ (mu)**: Service rate (average number of services completed per unit time)
- **ρ (rho)**: Utilization factor = λ/μ (must be < 1 for system stability)

## Important Performance Metrics

For a stable M/M/1 queue (ρ < 1):

1. **Average number of customers in system (L)**:
   ```
   L = ρ / (1 - ρ)
   ```

2. **Average number of customers in queue (Lq)**:
   ```
   Lq = ρ² / (1 - ρ)
   ```

3. **Average time in system (W)**:
   ```
   W = 1 / (μ - λ)
   ```

4. **Average time in queue (Wq)**:
   ```
   Wq = ρ / (μ - λ)
   ```

## Applications in Networking

M/M/1 models are commonly used to analyze:

1. **Network Router Performance**
   - Modeling packet processing at a router
   - Packets arrive randomly and are processed one at a time
   - Helps determine buffer sizes and expected delays

2. **Web Server Analysis**
   - Requests arrive according to a Poisson process
   - Single-threaded server processing requests
   - Predicts response times and queue lengths

3. **Communication Channels**
   - Messages arriving at a transmission channel
   - Channel can only transmit one message at a time
   - Helps in capacity planning

4. **Network Bandwidth Allocation**
   - Analyzing traffic flow through a bottleneck link
   - Understanding congestion and delay characteristics

## Example Calculation

Consider a network router where:
- Packets arrive at rate λ = 8 packets/second
- Router processes packets at rate μ = 10 packets/second

**Calculate:**
- Utilization: ρ = 8/10 = 0.8 (80% utilized)
- Average packets in system: L = 0.8/(1-0.8) = 4 packets
- Average packets in queue: Lq = 0.64/(1-0.8) = 3.2 packets
- Average time in system: W = 1/(10-8) = 0.5 seconds
- Average time in queue: Wq = 0.8/(10-8) = 0.4 seconds

## Limitations

While M/M/1 is useful, it has limitations:

1. **Exponential assumptions**: Real networks may not have exponential inter-arrival or service times
2. **Single server**: Many systems have multiple servers (M/M/c models)
3. **Infinite queue**: Real systems have finite buffers
4. **FIFO assumption**: Assumes First-In-First-Out scheduling

## When to Use M/M/1

M/M/1 is most appropriate when:
- Arrivals appear random and independent
- Service times are highly variable
- You need a simple, analytical model for initial analysis
- Understanding basic queueing behavior and trends

For more accurate modeling of real networks, consider:
- **M/M/c**: Multiple servers
- **M/G/1**: General service time distribution
- **M/M/1/K**: Finite buffer capacity
- Network simulation tools for complex scenarios

## References

- Kleinrock, L. (1975). Queueing Systems, Volume 1: Theory
- Bertsekas, D., & Gallager, R. (1992). Data Networks
- Ross, S. M. (2014). Introduction to Probability Models
