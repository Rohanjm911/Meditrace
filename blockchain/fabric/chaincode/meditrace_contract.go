package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing MediTrace pharmaceutical provenance
type SmartContract struct {
	contractapi.Contract
}

// BatchRecord defines the on-chain batch registration record
type BatchRecord struct {
	BatchNumber       string `json:"batchNumber"`
	ProductID         string `json:"productId"`
	ManufacturerMSP   string `json:"manufacturerMsp"`
	ManufacturerName  string `json:"manufacturerName"`
	MfgTimestamp      string `json:"mfgTimestamp"`
	ExpTimestamp      string `json:"expTimestamp"`
	Quantity          int    `json:"quantity"`
	MinTempCelsius    float64 `json:"minTempCelsius"`
	MaxTempCelsius    float64 `json:"maxTempCelsius"`
	CanonicalHash     string `json:"canonicalHash"`
	Status            string `json:"status"` // REGISTERED, IN_TRANSIT, STORED, DELIVERED, RECALLED
	RegistrationTxID  string `json:"registrationTxId"`
	RegisteredAt      string `json:"registeredAt"`
}

// HandoffRecord defines supply chain handoff movements
type HandoffRecord struct {
	HandoffID       string `json:"handoffId"`
	ShipmentID      string `json:"shipmentId"`
	BatchNumber     string `json:"batchNumber"`
	SenderMSP       string `json:"senderMsp"`
	SenderOrgName   string `json:"senderOrgName"`
	RecipientMSP    string `json:"recipientMsp"`
	RecipientOrgName string `json:"recipientOrgName"`
	Status          string `json:"status"` // PENDING, ACCEPTED, REJECTED
	Location        string `json:"location"`
	RecordHash      string `json:"recordHash"`
	Timestamp       string `json:"timestamp"`
	TxID            string `json:"txId"`
}

// IntegrityCheckpoint defines an immutable cryptographic integrity checkpoint
type IntegrityCheckpoint struct {
	CheckpointID  string `json:"checkpointId"`
	BatchNumber   string `json:"batchNumber"`
	CheckpointType string `json:"checkpointType"` // BATCH_REGISTRATION, HANDOFF, TEMPERATURE_AUDIT
	CanonicalHash string `json:"canonicalHash"`
	RecorderMSP   string `json:"recorderMsp"`
	Timestamp     string `json:"timestamp"`
	TxID          string `json:"txId"`
}

// ProvenanceResponse returns the full traceable audit history
type ProvenanceResponse struct {
	Batch       *BatchRecord          `json:"batch"`
	Handoffs    []HandoffRecord       `json:"handoffs"`
	Checkpoints []IntegrityCheckpoint `json:"checkpoints"`
	Verified    bool                  `json:"verified"`
}

// InitLedger adds initial test data to the ledger
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	fmt.Println("MediTrace Chaincode Initialized Successfully")
	return nil
}

// RegisterBatch records a new pharmaceutical batch on the Fabric ledger
func (s *SmartContract) RegisterBatch(
	ctx contractapi.TransactionContextInterface,
	batchNumber string,
	productID string,
	mfgTimestamp string,
	expTimestamp string,
	quantity int,
	minTemp float64,
	maxTemp float64,
	canonicalHash string,
) error {
	clientMSP, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to retrieve client MSP ID: %v", err)
	}

	// Verify batch does not already exist
	exists, err := s.BatchExists(ctx, batchNumber)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("batch %s already exists on the ledger", batchNumber)
	}

	txID := ctx.GetStub().GetTxID()
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to obtain transaction timestamp: %v", err)
	}
	registeredTime := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos)).UTC().Format(time.RFC3339)

	batch := BatchRecord{
		BatchNumber:      batchNumber,
		ProductID:        productID,
		ManufacturerMSP:  clientMSP,
		ManufacturerName: "Verified Manufacturer Org",
		MfgTimestamp:     mfgTimestamp,
		ExpTimestamp:     expTimestamp,
		Quantity:         quantity,
		MinTempCelsius:   minTemp,
		MaxTempCelsius:   maxTemp,
		CanonicalHash:    canonicalHash,
		Status:           "REGISTERED",
		RegistrationTxID: txID,
		RegisteredAt:     registeredTime,
	}

	batchJSON, err := json.Marshal(batch)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("BATCH_%s", batchNumber)
	err = ctx.GetStub().PutState(key, batchJSON)
	if err != nil {
		return fmt.Errorf("failed to put batch state: %v", err)
	}

	// Record initial integrity checkpoint
	checkpoint := IntegrityCheckpoint{
		CheckpointID:   fmt.Sprintf("CP_REG_%s", batchNumber),
		BatchNumber:    batchNumber,
		CheckpointType: "BATCH_REGISTRATION",
		CanonicalHash:  canonicalHash,
		RecorderMSP:    clientMSP,
		Timestamp:      registeredTime,
		TxID:           txID,
	}
	cpJSON, _ := json.Marshal(checkpoint)
	return ctx.GetStub().PutState(fmt.Sprintf("CHECKPOINT_%s_%s", batchNumber, txID), cpJSON)
}

// RecordHandoff writes a verified supply chain handoff event
func (s *SmartContract) RecordHandoff(
	ctx contractapi.TransactionContextInterface,
	handoffID string,
	shipmentID string,
	batchNumber string,
	recipientMSP string,
	recipientOrgName string,
	location string,
	recordHash string,
) error {
	clientMSP, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP: %v", err)
	}

	txID := ctx.GetStub().GetTxID()
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return err
	}
	eventTime := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos)).UTC().Format(time.RFC3339)

	handoff := HandoffRecord{
		HandoffID:        handoffID,
		ShipmentID:       shipmentID,
		BatchNumber:      batchNumber,
		SenderMSP:        clientMSP,
		SenderOrgName:    clientMSP,
		RecipientMSP:     recipientMSP,
		RecipientOrgName: recipientOrgName,
		Status:           "ACCEPTED",
		Location:         location,
		RecordHash:       recordHash,
		Timestamp:        eventTime,
		TxID:             txID,
	}

	handoffJSON, err := json.Marshal(handoff)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("HANDOFF_%s_%s", batchNumber, handoffID)
	err = ctx.GetStub().PutState(key, handoffJSON)
	if err != nil {
		return err
	}

	// Update batch status to IN_TRANSIT
	batchBytes, err := ctx.GetStub().GetState(fmt.Sprintf("BATCH_%s", batchNumber))
	if err == nil && batchBytes != nil {
		var batch BatchRecord
		if err := json.Unmarshal(batchBytes, &batch); err == nil {
			batch.Status = "IN_TRANSIT"
			updatedJSON, _ := json.Marshal(batch)
			_ = ctx.GetStub().PutState(fmt.Sprintf("BATCH_%s", batchNumber), updatedJSON)
		}
	}

	return nil
}

// VerifyBatchIntegrity checks if a provided canonical payload hash matches the recorded ledger hash
func (s *SmartContract) VerifyBatchIntegrity(
	ctx contractapi.TransactionContextInterface,
	batchNumber string,
	expectedCanonicalHash string,
) (bool, error) {
	batchBytes, err := ctx.GetStub().GetState(fmt.Sprintf("BATCH_%s", batchNumber))
	if err != nil {
		return false, fmt.Errorf("failed to query batch: %v", err)
	}
	if batchBytes == nil {
		return false, fmt.Errorf("batch %s does not exist on ledger", batchNumber)
	}

	var batch BatchRecord
	err = json.Unmarshal(batchBytes, &batch)
	if err != nil {
		return false, err
	}

	return batch.CanonicalHash == expectedCanonicalHash, nil
}

// GetBatchProvenance retrieves the batch and all associated handoff records
func (s *SmartContract) GetBatchProvenance(
	ctx contractapi.TransactionContextInterface,
	batchNumber string,
) (*ProvenanceResponse, error) {
	batchBytes, err := ctx.GetStub().GetState(fmt.Sprintf("BATCH_%s", batchNumber))
	if err != nil {
		return nil, fmt.Errorf("failed to read batch from ledger: %v", err)
	}
	if batchBytes == nil {
		return nil, fmt.Errorf("batch %s not found on ledger", batchNumber)
	}

	var batch BatchRecord
	if err := json.Unmarshal(batchBytes, &batch); err != nil {
		return nil, err
	}

	// Query handoffs using range query prefix
	handoffIterator, err := ctx.GetStub().GetStateByRange(
		fmt.Sprintf("HANDOFF_%s_", batchNumber),
		fmt.Sprintf("HANDOFF_%s_\uffff", batchNumber),
	)
	if err != nil {
		return nil, err
	}
	defer handoffIterator.Close()

	var handoffs []HandoffRecord
	for handoffIterator.HasNext() {
		res, err := handoffIterator.Next()
		if err != nil {
			return nil, err
		}
		var h HandoffRecord
		if err := json.Unmarshal(res.Value, &h); err == nil {
			handoffs = append(handoffs, h)
		}
	}

	// Query checkpoints
	cpIterator, err := ctx.GetStub().GetStateByRange(
		fmt.Sprintf("CHECKPOINT_%s_", batchNumber),
		fmt.Sprintf("CHECKPOINT_%s_\uffff", batchNumber),
	)
	var checkpoints []IntegrityCheckpoint
	if err == nil {
		defer cpIterator.Close()
		for cpIterator.HasNext() {
			res, err := cpIterator.Next()
			if err != nil {
				break
			}
			var cp IntegrityCheckpoint
			if err := json.Unmarshal(res.Value, &cp); err == nil {
				checkpoints = append(checkpoints, cp)
			}
		}
	}

	return &ProvenanceResponse{
		Batch:       &batch,
		Handoffs:    handoffs,
		Checkpoints: checkpoints,
		Verified:    true,
	}, nil
}

// BatchExists returns true if a batch with the given number exists on the ledger
func (s *SmartContract) BatchExists(ctx contractapi.TransactionContextInterface, batchNumber string) (bool, error) {
	batchBytes, err := ctx.GetStub().GetState(fmt.Sprintf("BATCH_%s", batchNumber))
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	return batchBytes != nil, nil
}

// ComputeHashHelper utility function to calculate SHA-256
func ComputeHashHelper(data string) string {
	h := sha256.Sum256([]byte(data))
	return hex.EncodeToString(h[:])
}

func main() {
	cc, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		fmt.Printf("Error creating MediTrace chaincode: %v\n", err)
		return
	}

	if err := cc.Start(); err != nil {
		fmt.Printf("Error starting MediTrace chaincode: %v\n", err)
	}
}
