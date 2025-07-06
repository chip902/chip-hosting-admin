import React from "react";

interface PaginationProps {
	totalItems: number;
	pageSize: number;
	currentPage: number;
	onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ totalItems, pageSize, currentPage, onPageChange }) => {
	const totalPages = Math.ceil(totalItems / pageSize);

	if (totalPages === 1) return null;

	const handlePrev = () => {
		if (currentPage > 1) onPageChange(currentPage - 1);
	};

	const handleNext = () => {
		if (currentPage < totalPages) onPageChange(currentPage + 1);
	};

	return (
		<div className="flex justify-center items-center mt-4">
			<button onClick={handlePrev} disabled={currentPage === 1}>
				Previous
			</button>
			<span className="mx-2">
				Page {currentPage} of {totalPages}
			</span>
			<button onClick={handleNext} disabled={currentPage === totalPages}>
				Next
			</button>
		</div>
	);
};

export default Pagination;
